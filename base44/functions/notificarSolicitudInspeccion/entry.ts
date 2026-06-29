import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * notificarSolicitudInspeccion
 *
 * Se dispara cuando se crea un ReportesDano (solicitud de inspección).
 * 1. Asigna el caso a un voluntario/especialista activo usando round-robin.
 * 2. Envía email de confirmación a quien reportó / pidió la inspección.
 * 3. Envía email de asignación al voluntario, con link directo a la ficha.
 * 4. Registra la asignación y los envíos en LogNotificaciones.
 *
 * Payload (desde automatización de entidad):
 *   { event: { entity_id }, data: {...ReportesDano} }
 * O invocación directa: { reporte_id }
 */

const APP_URL = 'https://status-vzla.base44.app';
const RR_KEY = 'inspeccion_round_robin_idx';

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const RIESGO_LABEL = {
  riesgo_colapso:  { es: 'Riesgo de colapso', en: 'Collapse risk' },
  riesgo_moderado: { es: 'Riesgo moderado',   en: 'Moderate risk' },
  solo_estetico:   { es: 'Solo daño estético', en: 'Cosmetic only' },
};

const NIVEL_LABEL = {
  leve:      { es: 'Daño leve', en: 'Minor damage' },
  moderado:  { es: 'Daño moderado', en: 'Moderate damage' },
  grave:     { es: 'Daño grave', en: 'Severe damage' },
  critico:   { es: 'Crítico', en: 'Critical' },
  colapsado: { es: 'Colapsado', en: 'Collapsed' },
  no_evaluado: { es: 'Sin evaluar', en: 'Not evaluated' },
};

function bloqueSeguridad(es) {
  return es
    ? `<p style="font-size:12px;color:#92400e;background:#fef9f0;border:1px solid #f59e0b40;border-radius:8px;padding:10px 12px;line-height:1.5;margin:16px 0 0;">⚠️ No entres a estructuras dañadas. Si hay grietas graves, olor a gas, cables caídos, incendio o personas atrapadas, espera a Protección Civil (171), Bomberos o rescatistas autorizados.</p>`
    : `<p style="font-size:12px;color:#92400e;background:#fef9f0;border:1px solid #f59e0b40;border-radius:8px;padding:10px 12px;line-height:1.5;margin:16px 0 0;">⚠️ Do not enter damaged structures. If there are major cracks, gas smell, fallen wires, fire, or trapped people, wait for Civil Protection (171), firefighters, or authorized rescue teams.</p>`;
}

function wrap(inner) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0D2259;padding:18px 24px;">
      <span style="font-size:18px;font-weight:800;color:#fff;">📍 Status<span style="color:#F5C518;"> Vzla</span></span>
    </div>
    <div style="padding:24px;">${inner}</div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">Status Vzla · Plataforma ciudadana de emergencias · No partidista · Sin fines de lucro</p>
    </div>
  </div>`;
}

function emailReportante(rep, es) {
  const lugar = esc(rep.nombre_lugar || rep.direccion || rep.ciudad || (es ? 'la estructura reportada' : 'the reported structure'));
  const inner = es
    ? `<h1 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 12px;">Recibimos tu solicitud de inspección ✅</h1>
       <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 12px;">Tu información sobre <b>${lugar}</b> fue almacenada de forma segura.</p>
       <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 12px;">Nuestro equipo técnico de voluntarios <b>analizará las imágenes y datos enviados</b>. Te contactaremos <b>lo antes posible</b> a través de los datos que nos diste para coordinar los próximos pasos o una visita presencial si es necesario.</p>
       <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 4px;">Tus datos de contacto son privados y no se muestran públicamente.</p>
       ${bloqueSeguridad(true)}`
    : `<h1 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 12px;">We received your inspection request ✅</h1>
       <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 12px;">Your information about <b>${lugar}</b> has been securely stored.</p>
       <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 12px;">Our volunteer technical team <b>will analyze the submitted images and data</b>. We will contact you <b>as soon as possible</b> using the details you provided to coordinate next steps or an on-site visit if necessary.</p>
       <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 4px;">Your contact details are private and never shown publicly.</p>
       ${bloqueSeguridad(false)}`;
  return wrap(inner);
}

function emailVoluntario(rep, reporteId, es) {
  const lugar = esc(rep.nombre_lugar || rep.direccion || rep.ciudad || (es ? 'Estructura' : 'Structure'));
  const ubic = esc([rep.direccion, rep.ciudad, rep.estado_region].filter(Boolean).join(', ') || '—');
  const riesgo = RIESGO_LABEL[rep.triage_riesgo]?.[es ? 'es' : 'en'] || NIVEL_LABEL[rep.nivel_dano]?.[es ? 'es' : 'en'] || (es ? 'Por clasificar' : 'To be classified');
  const atrapados = ['si', 'voces'].includes(rep.personas_atrapadas);
  const link = `${APP_URL}/edificio?id=${reporteId}`;
  const contacto = [rep.reportante_nombre, rep.reportante_telefono, rep.reportante_email].filter(Boolean).map(esc).join(' · ');
  const inner = es
    ? `<span style="display:inline-block;font-size:11px;font-weight:800;color:#1d4ed8;background:#dbeafe;padding:4px 10px;border-radius:20px;margin-bottom:12px;">🔧 NUEVA INSPECCIÓN ASIGNADA</span>
       <h1 style="font-size:19px;font-weight:800;color:#111827;margin:0 0 8px;">${lugar}</h1>
       <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">📍 ${ubic}</p>
       <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;margin:0 0 14px;">
         <tr><td style="padding:5px 0;color:#6b7280;">Clasificación:</td><td style="padding:5px 0;font-weight:700;">${esc(riesgo)}</td></tr>
         ${atrapados ? `<tr><td style="padding:5px 0;color:#b91c1c;">⚠ Atrapados:</td><td style="padding:5px 0;font-weight:700;color:#b91c1c;">Reporte de personas atrapadas</td></tr>` : ''}
         ${contacto ? `<tr><td style="padding:5px 0;color:#6b7280;">Contacto:</td><td style="padding:5px 0;">${contacto}</td></tr>` : ''}
         ${rep.descripcion ? `<tr><td style="padding:5px 0;color:#6b7280;vertical-align:top;">Notas:</td><td style="padding:5px 0;">${esc(rep.descripcion)}</td></tr>` : ''}
       </table>
       <a href="${link}" style="display:block;text-align:center;background:#1d4ed8;color:#fff;font-weight:700;font-size:14px;padding:13px;border-radius:10px;text-decoration:none;">Abrir ficha e iniciar inspección →</a>
       ${bloqueSeguridad(true)}`
    : `<span style="display:inline-block;font-size:11px;font-weight:800;color:#1d4ed8;background:#dbeafe;padding:4px 10px;border-radius:20px;margin-bottom:12px;">🔧 NEW INSPECTION ASSIGNED</span>
       <h1 style="font-size:19px;font-weight:800;color:#111827;margin:0 0 8px;">${lugar}</h1>
       <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">📍 ${ubic}</p>
       <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;margin:0 0 14px;">
         <tr><td style="padding:5px 0;color:#6b7280;">Classification:</td><td style="padding:5px 0;font-weight:700;">${esc(riesgo)}</td></tr>
         ${atrapados ? `<tr><td style="padding:5px 0;color:#b91c1c;">⚠ Trapped:</td><td style="padding:5px 0;font-weight:700;color:#b91c1c;">Trapped people reported</td></tr>` : ''}
         ${contacto ? `<tr><td style="padding:5px 0;color:#6b7280;">Contact:</td><td style="padding:5px 0;">${contacto}</td></tr>` : ''}
         ${rep.descripcion ? `<tr><td style="padding:5px 0;color:#6b7280;vertical-align:top;">Notes:</td><td style="padding:5px 0;">${esc(rep.descripcion)}</td></tr>` : ''}
       </table>
       <a href="${link}" style="display:block;text-align:center;background:#1d4ed8;color:#fff;font-weight:700;font-size:14px;padding:13px;border-radius:10px;text-decoration:none;">Open record & start inspection →</a>
       ${bloqueSeguridad(false)}`;
  return wrap(inner);
}

// Round-robin: selecciona el siguiente voluntario de forma rotatoria
async function asignarVoluntario(base44) {
  const perfiles = await base44.asServiceRole.entities.PerfilProfesional
    .filter({ completado: true })
    .catch(() => []);
  // Solo perfiles aprobados (o no requieren aprobación) con email
  const elegibles = (perfiles || [])
    .filter(p => p.user_email && (p.estado_aprobacion === 'aprobado' || p.tipo_perfil === 'voluntario'))
    .sort((a, b) => (a.id > b.id ? 1 : -1));
  if (elegibles.length === 0) return null;

  // Leer/avanzar índice round-robin
  let idx = 0;
  const contadores = await base44.asServiceRole.entities.ContadoresCache
    .filter({ clave: RR_KEY })
    .catch(() => []);
  const contador = contadores?.[0];
  if (contador) {
    idx = ((contador.valor || 0) + 1) % elegibles.length;
    await base44.asServiceRole.entities.ContadoresCache.update(contador.id, {
      valor: idx, ultima_actualizacion: new Date().toISOString(),
    }).catch(() => {});
  } else {
    await base44.asServiceRole.entities.ContadoresCache.create({
      clave: RR_KEY, valor: 0, ultima_actualizacion: new Date().toISOString(),
    }).catch(() => {});
  }
  return elegibles[idx];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const reporteId = body?.event?.entity_id || body?.reporte_id;
    let rep = body?.data;

    if (!rep && reporteId) {
      rep = await base44.asServiceRole.entities.ReportesDano.get(reporteId).catch(() => null);
    }
    if (!rep || !reporteId) {
      return Response.json({ error: 'Reporte no encontrado' }, { status: 400 });
    }

    const es = true; // CRIS por defecto en español para el equipo; el reportante recibe es por defecto
    let emailsEnviados = 0;
    let voluntarioNombre = null;

    // 1) Asignar voluntario (round-robin)
    const voluntario = await asignarVoluntario(base44);
    if (voluntario) {
      voluntarioNombre = voluntario.user_nombre || voluntario.user_email;
      // Guardar asignación en el reporte
      await base44.asServiceRole.entities.ReportesDano.update(reporteId, {
        voluntario_asignado_id: voluntario.user_id,
        voluntario_asignado_nombre: voluntarioNombre,
      }).catch(() => {});

      // 2) Email al voluntario asignado
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: voluntario.user_email,
          subject: `🔧 Inspección asignada: ${rep.nombre_lugar || rep.ciudad || 'Estructura'}`,
          body: emailVoluntario(rep, reporteId, true),
        });
        emailsEnviados++;
      } catch {}
    }

    // 3) Email de confirmación al reportante
    const reportanteEmail = (rep.reportante_email || '').trim();
    if (reportanteEmail) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: reportanteEmail,
          subject: 'Recibimos tu solicitud de inspección — Status Vzla',
          body: emailReportante(rep, true),
        });
        emailsEnviados++;
      } catch {}
    }

    // 4) Log
    await base44.asServiceRole.entities.LogNotificaciones.create({
      tipo: 'edificio',
      entidad_id: reporteId,
      entidad_nombre: rep.nombre_lugar || rep.direccion || rep.ciudad || '—',
      emails_enviados: emailsEnviados,
      accion: 'solicitud_inspeccion_asignada',
      detalles: voluntarioNombre
        ? `Asignado a ${voluntarioNombre}. Confirmación al reportante: ${reportanteEmail || 'sin email'}.`
        : `Sin voluntarios disponibles para asignar. Confirmación al reportante: ${reportanteEmail || 'sin email'}.`,
    }).catch(() => {});

    return Response.json({
      ok: true,
      asignado_a: voluntarioNombre,
      emails_enviados: emailsEnviados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
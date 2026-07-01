import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * notificarAsignacionInspeccion
 *
 * Se invoca cuando un inspector/voluntario toma una inspección.
 * 1. Genera un token privado para el formulario de contactos de acceso.
 * 2. Envía email detallado al inspector (formato completo acordado).
 * 3. Envía email al requiriente/reportante con enlace privado para agregar contactos.
 * 4. Registra en LogNotificaciones.
 *
 * Payload: { reporte_id, inspector_id, inspector_nombre, inspector_email, inspector_telefono? }
 */

const APP_URL = 'https://status-vzla.base44.app';

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Genera un token simple basado en el id del edificio + timestamp
function generarToken(reporteId) {
  const base = `${reporteId}-${Date.now()}`;
  // Encode en base64 url-safe simple
  return btoa(base).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function wrap(inner, titulo = '') {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;background:#F3F4F6;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0D2259,#1a3580);padding:20px 24px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:20px;font-weight:900;color:#fff;">📍 Status<span style="color:#F5C518;"> Vzla</span></span>
    </div>
    <div style="padding:28px 24px;">${inner}</div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#9ca3af;margin:0;line-height:1.5;">Status Vzla · Plataforma ciudadana de emergencias · No partidista · Sin fines de lucro<br>
      Si tienes preguntas, puedes responder a este correo.</p>
    </div>
  </div>
  </body></html>`;
}

function bloqueSeguridad() {
  return `<div style="background:#fef9f0;border:1px solid #f59e0b40;border-radius:8px;padding:12px 14px;margin:20px 0 0;">
    <p style="font-size:12px;color:#92400e;margin:0;line-height:1.6;">⚠️ <strong>Precaución:</strong> No ingreses a estructuras con daños graves sin autorización. Si detectas olor a gas, cables caídos, grietas estructurales o riesgo de colapso, espera a Protección Civil (171) o Bomberos antes de entrar.</p>
  </div>`;
}

function bloqueAntiPromesas() {
  return `<div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:12px 14px;margin:16px 0 0;">
    <p style="font-size:12px;color:#6b21a8;margin:0;line-height:1.6;">📌 <strong>Recuerda:</strong> Por favor evita hacer promesas sobre reparaciones, aprobaciones, pagos, ayudas económicas o tiempos de resolución. Tu rol es <strong>observar, documentar y reportar</strong> la situación de forma objetiva.</p>
  </div>`;
}

function fila(label, valor) {
  if (!valor) return '';
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;min-width:140px;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:500;">${esc(valor)}</td>
  </tr>`;
}

function emailInspector(rep, inspector, contactosUrl, fichaUrl, formularioUrl) {
  const lugar = esc(rep.nombre_lugar || rep.direccion || rep.ciudad || 'Estructura sin nombre');
  const dir = esc([rep.direccion, rep.ciudad, rep.estado_region].filter(Boolean).join(', ') || '—');
  const tipoEstructura = esc((rep.tipo_estructura || '').replace(/_/g, ' ') || '—');
  const motivo = esc(rep.descripcion || rep.triage_notas || '—');
  const tieneFotos = (rep.foto_urls || []).length > 0;
  const nombreInspector = esc(inspector.nombre || inspector.email);

  const contactosAcceso = (rep.contactos_acceso || []);
  const contactosPrev = contactosAcceso.length > 0
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin:12px 0;">
        <p style="font-size:12px;font-weight:700;color:#1e40af;margin:0 0 8px;">📋 Contactos de acceso registrados (${contactosAcceso.length}):</p>
        ${contactosAcceso.map(c => `<p style="font-size:12px;color:#1e3a8a;margin:2px 0;">· <strong>${esc(c.nombre)}</strong>${c.rol ? ` (${esc(c.rol)})` : ''} — ${esc(c.telefono || '')}${c.email ? ` · ${esc(c.email)}` : ''}</p>`).join('')}
       </div>`
    : `<p style="font-size:13px;color:#6b7280;font-style:italic;">Aún no hay contactos registrados. El/la solicitante puede agregarlos usando el enlace privado enviado a su correo.</p>`;

  const inner = `
    <h1 style="font-size:22px;font-weight:900;color:#111827;margin:0 0 6px;">Hola, ${nombreInspector} 👋</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">Antes que nada, queremos darte las gracias por tomar esta inspección y por ofrecer tu tiempo, experiencia y disposición para apoyar a esta comunidad. <strong>Tu trabajo es muy valioso.</strong></p>

    <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;margin:0 0 20px;">
      <p style="font-size:13px;font-weight:700;color:#1e40af;margin:0 0 4px;">🔧 NUEVA INSPECCIÓN ASIGNADA</p>
      <p style="font-size:20px;font-weight:800;color:#111827;margin:0;">${lugar}</p>
    </div>

    <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 8px;">📋 Datos del edificio o propiedad:</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      ${fila('Nombre:', rep.nombre_lugar)}
      ${fila('Dirección:', dir)}
      ${fila('Tipo de propiedad:', tipoEstructura)}
      ${fila('Nivel de daño:', (rep.nivel_dano || '').replace(/_/g, ' '))}
      ${fila('Clasificación triaje:', (rep.triage_riesgo || '').replace(/_/g, ' '))}
    </table>

    <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 8px;">👤 Datos del solicitante:</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      ${fila('Nombre:', rep.reportante_nombre)}
      ${fila('Teléfono:', rep.reportante_telefono)}
      ${fila('Correo electrónico:', rep.reportante_email)}
    </table>

    <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 8px;">🗂️ Motivo de la inspección:</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:0 0 20px;">
      <p style="font-size:13px;color:#374151;margin:0;line-height:1.6;">${motivo}</p>
    </div>

    <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 8px;">📷 Fotos o documentos recibidos:</p>
    <p style="font-size:13px;color:#374151;margin:0 0 20px;">${tieneFotos ? `Se recibieron <strong>${rep.foto_urls.length} foto(s)</strong>. Puedes verlas en la ficha del edificio.` : 'No se recibieron fotos previas.'}</p>

    <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 8px;">📇 Contactos de acceso:</p>
    ${contactosPrev}

    <div style="margin:24px 0 8px;">
      <p style="font-size:13px;color:#374151;line-height:1.6;margin:0 0 12px;">Te pedimos que, <strong>antes de visitar la ubicación</strong>, contactes al solicitante para confirmar la dirección, disponibilidad de horario, acceso al edificio y si alguna persona adicional debe estar presente durante la inspección.</p>
      <p style="font-size:13px;color:#374151;line-height:1.6;margin:0 0 12px;">Si esta ubicación no te resulta posible, segura o conveniente por distancia, horario, acceso, conflicto de interés u otra razón, por favor avísanos lo antes posible respondiendo a este correo. <strong>No hay problema en reasignar la inspección.</strong></p>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px;margin:24px 0;">
      <a href="${fichaUrl}" style="display:block;text-align:center;background:#1d4ed8;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;">🏢 Abrir ficha del edificio →</a>
      <a href="${formularioUrl}" style="display:block;text-align:center;background:#059669;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;">📋 Ir al formulario de inspección →</a>
      <a href="${contactosUrl}" style="display:block;text-align:center;background:#7c3aed;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;">👥 Ver / agregar contactos de acceso →</a>
    </div>

    ${bloqueAntiPromesas()}
    ${bloqueSeguridad()}

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:24px 0 0;">Gracias nuevamente por todo lo que haces. Tu apoyo permite que podamos atender más rápido a las personas, organizar mejor la respuesta y darles tranquilidad a quienes están esperando ayuda.</p>
    <p style="font-size:14px;color:#374151;margin:8px 0 0;"><strong>Atentamente,</strong><br>Equipo Status Vzla · <a href="mailto:villenagv@gmail.com" style="color:#2563eb;">villenagv@gmail.com</a></p>
  `;
  return wrap(inner);
}

function emailRequiriente(rep, inspector, contactosUrl, fichaUrl) {
  const lugar = esc(rep.nombre_lugar || rep.direccion || rep.ciudad || 'la estructura reportada');
  const nombreRequiriente = esc(rep.reportante_nombre || 'Estimado/a solicitante');
  const nombreInspector = esc(inspector.nombre || 'Nuestro especialista');

  const inner = `
    <h1 style="font-size:22px;font-weight:900;color:#111827;margin:0 0 6px;">Hola, ${nombreRequiriente} 👋</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">Tenemos buenas noticias. Se ha asignado un especialista para la inspección de <strong>${lugar}</strong>.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;margin:0 0 20px;">
      <p style="font-size:12px;font-weight:700;color:#15803d;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">✅ Inspector Asignado</p>
      <p style="font-size:17px;font-weight:800;color:#111827;margin:0 0 4px;">${nombreInspector}</p>
      ${inspector.telefono ? `<p style="font-size:13px;color:#374151;margin:0;">📞 <a href="tel:${esc(inspector.telefono)}" style="color:#2563eb;">${esc(inspector.telefono)}</a></p>` : ''}
      ${inspector.especialidad ? `<p style="font-size:12px;color:#6b7280;margin:4px 0 0;">🏛️ ${esc(inspector.especialidad)}</p>` : ''}
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">El inspector se pondrá en contacto contigo próximamente para coordinar la visita. Para que la inspección pueda realizarse de la mejor manera posible, te pedimos un favor importante:</p>

    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px 18px;margin:0 0 20px;">
      <p style="font-size:14px;font-weight:700;color:#6b21a8;margin:0 0 10px;">👥 Acción requerida de tu parte</p>
      <p style="font-size:13px;color:#374151;line-height:1.6;margin:0 0 12px;"><strong>Antes de la visita</strong>, te pedimos que agregues los contactos que puedan dar acceso o información sobre el edificio. Esto puede incluir: vecinos, miembros de la junta de condominio, el administrador del edificio, el portero, encargados de acceso u otras personas que puedan apoyar la coordinación.</p>
      <a href="${contactosUrl}" style="display:block;text-align:center;background:#7c3aed;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;margin:0 0 8px;">📋 Agregar contactos de acceso al edificio →</a>
      <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0;">Este enlace es privado. Solo personas con este enlace pueden acceder al formulario.</p>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">También puedes consultar el estado actualizado de la inspección en la ficha del edificio:</p>

    <a href="${fichaUrl}" style="display:block;text-align:center;background:#1d4ed8;color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:10px;text-decoration:none;margin:0 0 20px;">🏢 Ver ficha del edificio →</a>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px;margin:0 0 20px;">
      <p style="font-size:12px;color:#92400e;margin:0;line-height:1.6;">⚠️ <strong>Por tu seguridad:</strong> No entres al edificio sin autorización del inspector o autoridades competentes, especialmente si hay daños visibles, olor a gas, cables caídos o riesgo de colapso.</p>
    </div>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;margin:0 0 0;">
      <p style="font-size:12px;color:#991b1b;margin:0;line-height:1.6;">🚫 <strong>Aviso de seguridad:</strong> Nunca envíes dinero a cambio de información o servicios relacionados con esta inspección. Status Vzla no autoriza pagos, rescates privados ni intermediarios anónimos. Si alguien te pide dinero, repórtalo.</p>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:24px 0 0;"><strong>Atentamente,</strong><br>Equipo Status Vzla · <a href="mailto:villenagv@gmail.com" style="color:#2563eb;">villenagv@gmail.com</a></p>
  `;
  return wrap(inner);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validar auth - debe ser usuario autenticado (inspector)
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { reporte_id, inspector_id, inspector_nombre, inspector_email, inspector_telefono, inspector_especialidad } = body;

    if (!reporte_id) return Response.json({ error: 'reporte_id requerido' }, { status: 400 });

    // Obtener el reporte
    const rep = await base44.asServiceRole.entities.ReportesDano.get(reporte_id).catch(() => null);
    if (!rep) return Response.json({ error: 'Reporte no encontrado' }, { status: 404 });

    // Generar token privado para formulario de contactos
    const token = generarToken(reporte_id);

    // Guardar token en el reporte para validación posterior
    await base44.asServiceRole.entities.ReportesDano.update(reporte_id, {
      contactos_token: token,
      // Auto-agregar el reportante como primer contacto si tiene datos y no hay contactos aún
      ...(!(rep.contactos_acceso || []).length && rep.reportante_nombre ? {
        contactos_acceso: [{
          nombre: rep.reportante_nombre || '',
          telefono: rep.reportante_telefono || '',
          email: rep.reportante_email || '',
          rol: 'Solicitante / Reportante',
          notas: 'Agregado automáticamente al asignar inspección',
        }]
      } : {})
    }).catch(() => {});

    // URLs
    const fichaUrl = `${APP_URL}/edificio?id=${reporte_id}`;
    const contactosUrl = `${APP_URL}/contactos-acceso?edificio=${reporte_id}&token=${token}`;
    const formularioUrl = `${APP_URL}/inspecciones`; // va al portal del especialista

    const inspector = {
      nombre: inspector_nombre || user.full_name || user.email,
      email: inspector_email || user.email,
      telefono: inspector_telefono || '',
      especialidad: inspector_especialidad || '',
    };

    let emailsEnviados = 0;

    // 1. Email al inspector
    if (inspector.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: inspector.email,
          subject: `🔧 Inspección asignada: ${rep.nombre_lugar || rep.ciudad || 'Edificio'} — Status Vzla`,
          body: emailInspector(rep, inspector, contactosUrl, fichaUrl, formularioUrl),
        });
        emailsEnviados++;
      } catch (e) {
        console.error('Error email inspector:', e.message);
      }
    }

    // 2. Email al requiriente/reportante
    const emailReportante = (rep.reportante_email || '').trim();
    if (emailReportante) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: emailReportante,
          subject: `✅ Inspector asignado para tu solicitud — ${rep.nombre_lugar || rep.ciudad || 'Edificio'} — Status Vzla`,
          body: emailRequiriente(rep, inspector, contactosUrl, fichaUrl),
        });
        emailsEnviados++;
      } catch (e) {
        console.error('Error email reportante:', e.message);
      }
    }

    // 3. Log
    await base44.asServiceRole.entities.LogNotificaciones.create({
      tipo: 'edificio',
      entidad_id: reporte_id,
      entidad_nombre: rep.nombre_lugar || rep.direccion || rep.ciudad || '—',
      emails_enviados: emailsEnviados,
      accion: 'inspector_asignado_notificado',
      detalles: `Inspector: ${inspector.nombre} (${inspector.email}). Reportante: ${emailReportante || 'sin email'}. Token contactos generado.`,
    }).catch(() => {});

    return Response.json({
      ok: true,
      emails_enviados: emailsEnviados,
      token,
      contactos_url: contactosUrl,
      ficha_url: fichaUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
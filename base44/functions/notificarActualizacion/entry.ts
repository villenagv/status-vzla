import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';

const ESTADO_LABEL = {
  es: {
    buscando: 'Buscando información',
    informacion_recibida: 'Información recibida',
    visto_no_confirmado: 'Visto — sin confirmar',
    encontrado_con_vida: 'Encontrado/a con vida',
    en_hospital_refugio: 'En hospital o refugio',
    fallecido_reportado: 'Fallecimiento reportado',
    caso_cerrado: 'Caso cerrado',
  },
  en: {
    buscando: 'Searching for information',
    informacion_recibida: 'Information received',
    visto_no_confirmado: 'Seen — unconfirmed',
    encontrado_con_vida: 'Found alive',
    en_hospital_refugio: 'In hospital or shelter',
    fallecido_reportado: 'Death reported',
    caso_cerrado: 'Case closed',
  },
};

const ESTADO_COLOR = {
  buscando: '#FFF8EE',
  informacion_recibida: '#EFF6FF',
  visto_no_confirmado: '#FFF7ED',
  encontrado_con_vida: '#F0FDF4',
  en_hospital_refugio: '#F0FDFA',
  fallecido_reportado: '#F9FAFB',
  caso_cerrado: '#F9FAFB',
};

function escapeHtml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function buildHtml({ nombre, estadoLabel, estadoColor, ubicacion, mensaje, profileLink, es }) {
  return `<!DOCTYPE html><html lang="${es ? 'es' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F4F4F8;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:24px 16px;"><tr><td align="center"><table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;"><tr><td style="background:#1A1F2E;padding:20px 28px;"><p style="margin:0;color:#fff;font-size:20px;font-weight:900;">STATUS<span style="color:#D48C2E;">VZLA</span></p><p style="margin:4px 0 0;color:#9CA3AF;font-size:11px;">${es ? 'Sistema de respuesta a emergencias · Venezuela' : 'Emergency response system · Venezuela'}</p></td></tr><tr><td style="padding:24px 28px 12px;"><div style="background:${estadoColor || '#FFF8EE'};border-radius:12px;padding:18px;text-align:center;"><h2 style="margin:0;font-size:20px;font-weight:900;color:#1A1F2E;">${escapeHtml(nombre)}</h2>${estadoLabel ? `<p style="margin:8px 0 0;display:inline-block;background:#1A1F2E;color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:50px;">${escapeHtml(estadoLabel)}</p>` : ''}${ubicacion ? `<p style="margin:8px 0 0;font-size:12px;color:#6B7280;">📍 ${escapeHtml(ubicacion)}</p>` : ''}</div></td></tr>${mensaje ? `<tr><td style="padding:0 28px 16px;"><p style="margin:0;font-size:14px;color:#4B5563;line-height:1.5;background:#F9FAFB;border-radius:10px;padding:14px;">"${escapeHtml(mensaje)}"</p></td></tr>` : ''}<tr><td style="padding:0 28px 16px;"><a href="${profileLink}" style="display:block;background:#1A1F2E;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">${es ? '🔍 Ver información completa' : '🔍 View full information'}</a></td></tr><tr><td style="padding:0 28px 16px;"><div style="background:#FDF1F0;border:1px solid #E8B4B0;border-radius:10px;padding:12px;"><p style="margin:0;font-size:11px;color:#B83A52;line-height:1.5;">${es ? '⚠️ Nunca envíes dinero a cambio de información. STATUSVZLA.com no autoriza pagos ni rescates privados.' : '⚠️ Never send money in exchange for information. STATUSVZLA.com does not authorize payments or private rescue fees.'}</p></div></td></tr><tr><td style="background:#F9FAFB;padding:16px 28px;border-top:1px solid #F3F4F6;"><p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.5;">${es ? 'Mensaje automático de STATUSVZLA.com. Recibiste este mensaje porque te suscribiste a novedades de esta persona.' : 'Automatic message from STATUSVZLA.com. You received this because you subscribed to updates for this person.'}</p></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Soporta tanto llamada directa (persona_id + datos_persona)
    // como payload de automation de entidad (event.entity_id + data)
    let persona_id = body.persona_id;
    let datos_persona = body.datos_persona || {};
    const lang = body.lang || 'es';

    // Si viene del automation de entidad
    if (!persona_id && body.event?.entity_id) {
      persona_id = body.event.entity_id;
    }
    if (!persona_id && body.event?.entity_name === 'PersonasBuscadas') {
      persona_id = body.event?.entity_id;
    }

    // Si datos_persona está vacío y tenemos la data del automation
    if (Object.keys(datos_persona).length === 0 && body.data) {
      datos_persona = body.data;
    }

    // Si aún no tenemos datos completos, buscarlos
    if (!datos_persona.nombre_completo && persona_id) {
      try {
        const p = await base44.asServiceRole.entities.PersonasBuscadas.get(persona_id);
        datos_persona = { ...p, ...datos_persona };
      } catch {}
    }

    if (!persona_id) return Response.json({ error: 'persona_id requerido' }, { status: 400 });

    const es = lang !== 'en';
    const nombre = datos_persona.nombre_completo || 'La persona';
    const estadoCaso = datos_persona.estado_caso || 'buscando';
    const estadoLabel = (ESTADO_LABEL[lang] || ESTADO_LABEL['es'])[estadoCaso] || estadoCaso;
    const estadoColor = ESTADO_COLOR[estadoCaso] || '#FFF8EE';
    const ubicacion = datos_persona.ubicacion || datos_persona.ultima_ubicacion_conocida || '';
    const mensaje = datos_persona.mensaje || datos_persona.notas_publicas || '';

    const emails = new Set();
    const [seguimiento, porCuenta] = await Promise.all([
      base44.asServiceRole.entities.SuscriptoresSeguimiento.filter({ reporte_id: persona_id, activo: true }),
      base44.asServiceRole.entities.Suscripciones.filter({ persona_id, activa: true }),
    ]);

    for (const s of seguimiento) {
      const val = s.telefono_whatsapp?.trim();
      if (val && val.includes('@')) emails.add(val.toLowerCase());
    }
    for (const s of porCuenta) {
      if (s.email_notificacion?.trim()) emails.add(s.email_notificacion.trim().toLowerCase());
    }

    if (emails.size === 0) return Response.json({ ok: true, notificados: 0, motivo: 'sin_suscriptores' });

    const subject = es
      ? `StatusVzla · ${nombre} — ${estadoLabel}`
      : `StatusVzla · ${nombre} — ${estadoLabel}`;
    const htmlBody = buildHtml({ nombre, estadoLabel, estadoColor, ubicacion, mensaje, profileLink: `${APP_URL}/persona?id=${persona_id}`, es });

    let enviados = 0;
    for (const email of emails) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body: htmlBody, from_name: 'StatusVzla · CRIS' });
        enviados++;
      } catch (e) {
        console.warn(`Error enviando a ${email}: ${e.message}`);
      }
    }
    try {
      await base44.asServiceRole.entities.LogNotificaciones.create({
        tipo: 'persona', entidad_id: persona_id, entidad_nombre: nombre || '',
        emails_enviados: enviados, accion: 'actualizacion',
        detalles: `${subject} | estado: ${estadoLabel}`,
      });
    } catch {}

    return Response.json({ ok: true, notificados: enviados, total: emails.size });
  } catch (error) {
    console.error('Error en notificarActualizacion:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';
const BANNER_URL = 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/2d268252b_ChatGPTImageJun29202612_43_55AM.png';

const NIVEL_LABELS = {
  es: { leve: 'Daño leve 🟡', moderado: 'Daño moderado 🟠', grave: '🔴 Daño grave — NO ENTRAR', critico: '🔴 CRÍTICO — NO ENTRAR', colapsado: '💥 COLAPSADO — EVACUADO', no_evaluado: 'Sin evaluar ⚪' },
  en: { leve: 'Minor damage 🟡', moderado: 'Moderate damage 🟠', grave: '🔴 Severe damage — DO NOT ENTER', critico: '🔴 CRITICAL — DO NOT ENTER', colapsado: '💥 COLLAPSED — EVACUATED', no_evaluado: 'Not evaluated ⚪' },
};

const ACCION_LABELS = {
  es: {
    tengo_actualizacion: '🔄 Nueva actualización',
    confirmo_mismo_estado: '✅ Estado confirmado por vecino',
    informacion_incorrecta: '⚠️ Información reportada como incorrecta',
    reportar_urgencia: '🚨 URGENCIA REPORTADA',
    nuevo_nivel_dano: '📍 Nivel de daño actualizado',
    personas_atrapadas: '🆘 PERSONAS ATRAPADAS REPORTADAS',
    persona_herida_recuperada: '🩹 Persona herida recuperada',
    persona_fallecida_recuperada: '⚫ Persona fallecida recuperada',
    riesgo_marcado: '💨 Nuevo riesgo marcado',
    estado_cambiado: '📋 Estado cambiado',
    verificado: '🏛️ Verificado por institución',
  },
  en: {
    tengo_actualizacion: '🔄 New update',
    confirmo_mismo_estado: '✅ Status confirmed by neighbor',
    informacion_incorrecta: '⚠️ Information reported as incorrect',
    reportar_urgencia: '🚨 EMERGENCY REPORTED',
    nuevo_nivel_dano: '📍 Damage level updated',
    personas_atrapadas: '🆘 TRAPPED PEOPLE REPORTED',
    persona_herida_recuperada: '🩹 Injured person recovered',
    persona_fallecida_recuperada: '⚫ Deceased person recovered',
    riesgo_marcado: '💨 New hazard marked',
    estado_cambiado: '📋 Status changed',
    verificado: '🏛️ Verified by institution',
  },
};

function escapeHtml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function extraerContactos(texto, reportanteNombre = '') {
  const body = String(texto || '');
  const telefonos = [...new Set((body.match(/(?:\+?\d[\d\s().-]{6,}\d)/g) || []).map(t => t.replace(/\s+/g, ' ').trim()))];
  const nombres = reportanteNombre ? [reportanteNombre] : [];
  const patrones = [/(?:nombre|contacto|reportante)\s*[:\-]\s*([^\n,;]+)/gi, /(?:preguntar por|hablar con|llamar a)\s+([^\n,;.]+)/gi];
  for (const patron of patrones) {
    let match;
    while ((match = patron.exec(body)) !== null) {
      const nombre = match[1].trim();
      if (nombre && nombre.length <= 60 && !/\d/.test(nombre) && !nombres.includes(nombre)) nombres.push(nombre);
    }
  }
  return telefonos.map((telefono, index) => ({ nombre: nombres[index] || nombres[0] || '', telefono })).slice(0, 5);
}

function renderContactos(contactos, es) {
  if (!contactos.length) return '';
  const rows = contactos.map(c => `<li style="margin:4px 0;font-size:13px;color:#374151;"><strong>${escapeHtml(c.nombre || (es ? 'Contacto' : 'Contact'))}</strong>${c.telefono ? ` · ${escapeHtml(c.telefono)}` : ''}</li>`).join('');
  return `<tr><td style="padding:0 28px 16px;"><div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;"><p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#166534;">${es ? 'Contactos mencionados en la actualización' : 'Contacts mentioned in the update'}</p><ul style="margin:0;padding-left:18px;">${rows}</ul><p style="margin:8px 0 0;font-size:11px;color:#166534;line-height:1.4;">${es ? 'Verifica la información antes de compartirla. Nunca envíes dinero.' : 'Verify this information before sharing it. Never send money.'}</p></div></td></tr>`;
}

function buildCampaignBlock(es) {
  const titulo = es ? '📢 Ayúdanos a publicar esto en tus redes' : '📢 Help us share this on your networks';
  const desc = es
    ? 'Descarga la imagen adjunta y compártela en WhatsApp, Instagram, Facebook o Twitter. Cada persona que reporte información puede salvar vidas.'
    : 'Download the attached image and share it on WhatsApp, Instagram, Facebook or Twitter. Every person who reports information can save lives.';
  return `
<tr><td style="padding:8px 28px 20px;">
  <div style="background:linear-gradient(135deg,#0D2B6B 0%,#1A3A8F 50%,#0D2B6B 100%);border-radius:14px;padding:20px;text-align:center;border:2px solid #D48C2E;">
    <p style="margin:0 0 6px;font-size:13px;font-weight:900;color:#F59E0B;text-transform:uppercase;letter-spacing:0.05em;">${titulo}</p>
    <p style="margin:0 0 14px;font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5;">${desc}</p>
    <div style="background:rgba(255,255,255,0.08);border-radius:10px;padding:12px;text-align:left;margin-bottom:14px;">
      <p style="margin:0 0 4px;font-size:12px;color:#fff;">✅ ${es ? '1. Descarga la imagen adjunta a este correo.' : '1. Download the image attached to this email.'}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#fff;">✅ ${es ? '2. Compártela en tus redes sociales.' : '2. Share it on your social networks.'}</p>
      <p style="margin:0;font-size:12px;color:#fff;">✅ ${es ? '3. Invita a otros a reportar en:' : '3. Invite others to report at:'} <a href="${APP_URL}/edificios" style="color:#F59E0B;font-weight:700;text-decoration:none;">statusvzla.com/edificios</a></p>
    </div>
    <a href="${APP_URL}/edificios" style="display:inline-block;background:#F59E0B;color:#0D2B6B;text-decoration:none;font-size:13px;font-weight:900;padding:10px 24px;border-radius:10px;">
      🏗️ ${es ? 'Ver todos los edificios →' : 'See all buildings →'}
    </a>
  </div>
</td></tr>`;
}

async function getBannerAttachment() {
  try {
    const res = await fetch(BANNER_URL);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return { filename: 'statusvzla_ayudanos_a_actualizar.jpg', content: base64, content_type: 'image/jpeg' };
  } catch {
    return null;
  }
}

function buildHtml({ nombre, estadoLabel, accionLabel, nivelLabel, direccion, ciudad, mensaje, contactos, profileLink, esUrgente, es }) {
  const headerColor = esUrgente ? '#7F1D1D' : '#1A1F2E';
  const badgeColor = esUrgente ? '#DC2626' : '#1E40AF';

  return `<!DOCTYPE html><html lang="${es ? 'es' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:24px 16px;"><tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

<!-- HEADER -->
<tr><td style="background:${headerColor};padding:20px 28px;">
  <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Status Vzla · CRIS</p>
  <p style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:900;">${es ? '🔔 Actualización del edificio' : '🔔 Building update'}</p>
</td></tr>

<!-- EDIFICIO + ESTADO -->
<tr><td style="padding:20px 28px 12px;">
  <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:16px 18px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">${es ? 'Edificio reportado' : 'Reported building'}</p>
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:900;color:#111827;">${escapeHtml(nombre)}</h2>
    ${direccion ? `<p style="margin:0 0 4px;font-size:12px;color:#6B7280;">📍 ${escapeHtml(direccion)}${ciudad ? ` · ${escapeHtml(ciudad)}` : ''}</p>` : ''}
    <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
      <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;">${escapeHtml(accionLabel)}</span>
      ${nivelLabel ? `<span style="display:inline-block;background:#F3F4F6;border:1px solid #E5E7EB;color:#374151;font-size:11px;font-weight:600;padding:4px 12px;border-radius:50px;">${escapeHtml(nivelLabel)}</span>` : ''}
    </div>
  </div>
</td></tr>

<!-- MENSAJE / DESCRIPCIÓN -->
${mensaje ? `<tr><td style="padding:0 28px 16px;">
  <div style="background:#F9FAFB;border-left:4px solid ${badgeColor};border-radius:0 10px 10px 0;padding:14px 16px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">${es ? 'Descripción del reporte' : 'Report description'}</p>
    <p style="margin:0;font-size:14px;color:#1F2937;line-height:1.6;">"${escapeHtml(mensaje)}"</p>
  </div>
</td></tr>` : ''}

<!-- CONTACTOS -->
${renderContactos(contactos, es)}

<!-- ALERTA SEGURIDAD EDIFICIO -->
${esUrgente ? `<tr><td style="padding:0 28px 16px;">
  <div style="background:#FEF2F2;border:2px solid #FCA5A5;border-radius:10px;padding:14px;">
    <p style="margin:0;font-size:12px;font-weight:700;color:#991B1B;line-height:1.6;">🚫 ${es ? 'NO ENTRAR al edificio. Espera a Protección Civil (171), Bomberos o rescatistas autorizados.' : 'DO NOT ENTER the building. Wait for Civil Protection (171), firefighters, or authorized rescue teams.'}</p>
  </div>
</td></tr>` : ''}

<!-- BOTÓN VER EDIFICIO -->
<tr><td style="padding:0 28px 16px;text-align:center;">
  <a href="${profileLink}" style="display:inline-block;background:${headerColor};color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 30px;border-radius:12px;">
    🏗️ ${es ? 'Ver ficha completa del edificio →' : 'View full building record →'}
  </a>
</td></tr>

<!-- ANTI-FRAUDE -->
<tr><td style="padding:0 28px 16px;">
  <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;">
    <p style="margin:0;font-size:11px;color:#92400E;line-height:1.6;">⚠️ ${es ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios anónimos.' : 'Never send money in exchange for information. This platform does not authorize payments, private rescue fees, or anonymous intermediaries.'}</p>
  </div>
</td></tr>

<!-- BLOQUE CAMPAÑA -->
${buildCampaignBlock(es)}

<!-- FOOTER -->
<tr><td style="background:#F9FAFB;padding:16px 28px;border-top:1px solid #F3F4F6;">
  <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.5;">${es ? 'Recibes este email porque estás suscrito/a a actualizaciones de este edificio. StatusVzla es una herramienta ciudadana y no partidista.' : 'You receive this email because you are subscribed to updates for this building. StatusVzla is a citizen, non-partisan tool.'}</p>
</td></tr>

</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { edificio_id, tipo_accion, nivel_dano, direccion, ciudad, nombre_lugar, descripcion, notas, reportante_nombre, reportante_telefono, telefono_contacto, lang = 'es' } = await req.json();
    if (!edificio_id) return Response.json({ error: 'edificio_id requerido' }, { status: 400 });

    const es = lang !== 'en';
    const accionLabel = ACCION_LABELS[lang]?.[tipo_accion] || (es ? '🔄 Actualización' : '🔄 Update');
    const nivelLabel = NIVEL_LABELS[lang]?.[nivel_dano] || '';
    const esUrgente = ['personas_atrapadas', 'reportar_urgencia', 'critico', 'colapsado', 'grave'].includes(tipo_accion || nivel_dano);
    const telefono = reportante_telefono || telefono_contacto || '';
    const mensaje = descripcion || notas || (reportante_nombre ? `${es ? 'Reportado por' : 'Reported by'} ${reportante_nombre}${telefono ? ` · ${telefono}` : ''}` : '');
    const contactosDirectos = reportante_nombre || telefono ? [{ nombre: reportante_nombre || '', telefono }] : [];
    const contactos = contactosDirectos.length ? contactosDirectos : extraerContactos([descripcion, notas].filter(Boolean).join('\n'), reportante_nombre || '');

    const emails = new Set();
    const [seguimiento, porCuenta] = await Promise.all([
      base44.asServiceRole.entities.SuscriptoresSeguimiento.filter({ reporte_id: edificio_id, activo: true }),
      base44.asServiceRole.entities.Suscripciones.filter({ edificio_id, activa: true }),
    ]);
    for (const s of seguimiento) {
      const email = s.telefono_whatsapp?.trim();
      if (email && email.includes('@')) emails.add(email);
    }
    for (const s of porCuenta) {
      if (s.email_notificacion?.trim()) emails.add(s.email_notificacion.trim());
    }
    if (emails.size === 0) return Response.json({ ok: true, notificados: 0, motivo: 'sin_suscriptores' });

    const nombre = nombre_lugar || (es ? 'Edificio sin nombre' : 'Unnamed building');
    const profileLink = `${APP_URL}/edificio?id=${edificio_id}`;
    const subject = esUrgente
      ? (es ? `🚨 URGENTE — ${nombre}: ${accionLabel}` : `🚨 URGENT — ${nombre}: ${accionLabel}`)
      : (es ? `StatusVzla | ${nombre} — ${accionLabel}` : `StatusVzla | ${nombre} — ${accionLabel}`);

    const body = buildHtml({ nombre, estadoLabel: accionLabel, accionLabel, nivelLabel, direccion, ciudad, mensaje, contactos, profileLink, esUrgente, es });

    // Obtener imagen adjunta
    const attachment = await getBannerAttachment();

    let enviados = 0;
    for (const email of emails) {
      try {
        const payload: any = { to: email, subject, body, from_name: 'StatusVzla' };
        if (attachment) payload.attachments = [attachment];
        await base44.asServiceRole.integrations.Core.SendEmail(payload);
        enviados++;
      } catch (e) {
        console.warn(`Error enviando a ${email}: ${e.message}`);
      }
    }

    if (enviados > 0) {
      try {
        await base44.asServiceRole.entities.LogNotificaciones.create({
          tipo: 'edificio',
          entidad_id: edificio_id,
          entidad_nombre: nombre_lugar || '',
          emails_enviados: enviados,
          accion: tipo_accion || 'actualizacion',
        });
        const cacheExisting = await base44.asServiceRole.entities.ContadoresCache.filter({ clave: 'emails_enviados_total' });
        if (cacheExisting.length > 0) {
          await base44.asServiceRole.entities.ContadoresCache.update(cacheExisting[0].id, { valor: (cacheExisting[0].valor || 0) + enviados, ultima_actualizacion: new Date().toISOString() });
        } else {
          await base44.asServiceRole.entities.ContadoresCache.create({ clave: 'emails_enviados_total', valor: enviados, ultima_actualizacion: new Date().toISOString() });
        }
      } catch (e) {
        console.warn('Error registrando log:', e.message);
      }
    }

    return Response.json({ ok: true, notificados: enviados, total: emails.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
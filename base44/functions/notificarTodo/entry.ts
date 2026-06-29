import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';

function inyectarAntiExtorsion(html, es) {
  const msg = es
    ? '⚠️ Nunca envíes dinero a cambio de información. STATUSVZLA.com no autoriza pagos ni rescates privados. Si alguien pide dinero, es una estafa.'
    : '⚠️ Never send money in exchange for information. STATUSVZLA.com does not authorize payments or private rescue fees. If someone asks for money, it\'s a scam.';
  return html.replace('{{ANTI_EXTORSION}}', msg);
}

function escapeHtml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function extraerContactos(payload) {
  const texto = [payload.mensaje, payload.notas, payload.descripcion, payload.reportante_nombre, payload.contacto_nombre, payload.contacto_telefono, payload.reportante_telefono].filter(Boolean).join('\n');
  const telefonos = [...new Set((texto.match(/(?:\+?\d[\d\s().-]{6,}\d)/g) || []).map(t => t.replace(/\s+/g, ' ').trim()))];
  const nombres = [];
  const patrones = [/(?:nombre|contacto|reportante)\s*[:\-]\s*([^\n,;]+)/gi, /(?:preguntar por|hablar con|llamar a)\s+([^\n,;.]+)/gi];
  for (const patron of patrones) {
    let match;
    while ((match = patron.exec(texto)) !== null) {
      const nombre = match[1].trim();
      if (nombre && nombre.length <= 60 && !/\d/.test(nombre) && !nombres.includes(nombre)) nombres.push(nombre);
    }
  }
  if (payload.reportante_nombre && !nombres.includes(payload.reportante_nombre)) nombres.unshift(payload.reportante_nombre);
  return telefonos.map((telefono, index) => ({ nombre: nombres[index] || nombres[0] || '', telefono })).slice(0, 5);
}

function renderContactos(contactos, es) {
  if (!contactos.length) return '';
  const rows = contactos.map(c => `<li style="margin:4px 0;font-size:13px;color:#374151;"><strong>${escapeHtml(c.nombre || (es ? 'Contacto' : 'Contact'))}</strong>${c.telefono ? ` · ${escapeHtml(c.telefono)}` : ''}</li>`).join('');
  return `<tr><td style="padding:0 28px 16px;"><div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;"><p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#166534;">${es ? 'Contactos mencionados en la actualización' : 'Contacts mentioned in the update'}</p><ul style="margin:0;padding-left:18px;">${rows}</ul><p style="margin:8px 0 0;font-size:11px;color:#166534;line-height:1.4;">${es ? 'Verifica la información antes de compartirla. Nunca envíes dinero.' : 'Verify this information before sharing it. Never send money.'}</p></div></td></tr>`;
}

function buildHtml({ tipo, nombre, estadoLabel, estadoColor, ubicacion, mensaje, contactos, profileLink, updateLink, es }) {
  const headerTitle = es ? `${tipo}: ${nombre}` : `${tipo}: ${nombre}`;

  return `<!DOCTYPE html><html lang="${es ? 'es' : 'en'}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${headerTitle}</title></head>
<body style="margin:0;padding:0;background:#F4F4F8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:24px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:#1A1F2E;padding:20px 28px;">
  <p style="margin:0;color:#fff;font-size:20px;font-weight:900;">STATUS<span style="color:#D48C2E;">VZLA</span><span style="color:#D48C2E;font-size:14px;">.com</span></p>
  <p style="margin:4px 0 0;color:#9CA3AF;font-size:11px;">${es ? 'Sistema de respuesta a emergencias · Venezuela' : 'Emergency response system · Venezuela'}</p>
</td></tr>
<tr><td style="padding:24px 28px 12px;">
  <div style="background:${estadoColor || '#FFF8EE'};border-radius:12px;padding:18px;text-align:center;">
    <h2 style="margin:0;font-size:20px;font-weight:900;color:#1A1F2E;">${escapeHtml(nombre)}</h2>
    ${estadoLabel ? `<p style="margin:8px 0 0;display:inline-block;background:#1A1F2E;color:#fff;font-size:12px;font-weight:700;padding:4px 14px;border-radius:50px;">${escapeHtml(estadoLabel)}</p>` : ''}
    ${ubicacion ? `<p style="margin:8px 0 0;font-size:12px;color:#6B7280;">📍 ${escapeHtml(ubicacion)}</p>` : ''}
  </div>
</td></tr>
${mensaje ? `<tr><td style="padding:0 28px 16px;"><p style="margin:0;font-size:14px;color:#4B5563;line-height:1.5;background:#F9FAFB;border-radius:10px;padding:14px;">"${escapeHtml(mensaje)}"</p></td></tr>` : ''}
${renderContactos(contactos || [], es)}
<tr><td style="padding:0 28px 16px;">
  <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">
    ${es ? 'Recibiste esta notificación porque sigues esta información en StatusVzla.' : 'You received this notification because you follow this information on StatusVzla.'}
  </p>
</td></tr>
<tr><td style="padding:0 28px 16px;">
  <a href="${profileLink}" style="display:block;background:#1A1F2E;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;margin-bottom:8px;">
    ${es ? '🔍 Ver información completa' : '🔍 View full information'}
  </a>
  ${updateLink ? `<a href="${updateLink}" style="display:block;background:#fff;border:2px solid #D48C2E;color:#D48C2E;text-decoration:none;text-align:center;padding:12px;border-radius:10px;font-weight:700;font-size:13px;">
    ${es ? '🔄 Tengo información' : '🔄 I have information'}</a>` : ''}
</td></tr>
<tr><td style="padding:0 28px 16px;">
  <div style="background:#FDF1F0;border:1px solid #E8B4B0;border-radius:10px;padding:12px;">
    <p style="margin:0;font-size:11px;color:#B83A52;line-height:1.5;">{{ANTI_EXTORSION}}</p>
  </div>
</td></tr>
<tr><td style="background:#F9FAFB;padding:16px 28px;border-top:1px solid #F3F4F6;">
  <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.5;">
    ${es ? 'Este mensaje fue generado automáticamente por STATUSVZLA.com — Sistema de respuesta a emergencias.' : 'This message was automatically generated by STATUSVZLA.com — Emergency response system.'}
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { tipo, entidad_id, nombre, estado_label, estado_color, ubicacion, mensaje, reportante_nombre, lang } = payload;

    if (!tipo || !entidad_id) {
      return Response.json({ error: 'tipo y entidad_id requeridos' }, { status: 400 });
    }

    const emails = new Set();
    const { asServiceRole } = base44;

    // 1. Suscriptores anónimos (botón "Avísame" en cada ficha) — los más comunes
    const seguimiento = await asServiceRole.entities.SuscriptoresSeguimiento.filter({
      reporte_id: entidad_id,
      activo: true,
    });
    for (const s of seguimiento) {
      const email = s.telefono_whatsapp?.trim();
      if (email && email.includes('@')) emails.add(email);
    }

    // 2. Suscriptores con cuenta (Suscripciones), por si se unieron también
    const filtroCuenta = tipo === 'edificio'
      ? { edificio_id: entidad_id, activa: true }
      : { persona_id: entidad_id, activa: true };
    const porCuenta = await asServiceRole.entities.Suscripciones.filter(filtroCuenta);
    for (const s of porCuenta) {
      if (s.email_notificacion?.trim()) emails.add(s.email_notificacion.trim());
    }

    if (emails.size === 0) {
      return Response.json({ ok: true, enviados: 0, total: 0, motivo: 'sin_suscriptores' });
    }

    const es = lang !== 'en';

    const tipoLabel = { es: { persona: 'Persona', edificio: 'Edificio' },
      en: { persona: 'Person', edificio: 'Building' } };
    const tipoEs = tipoLabel.es[tipo] || 'Actualización';
    const tipoEn = tipoLabel.en[tipo] || 'Update';

    const profileLink = `${APP_URL}/${tipo === 'persona' ? 'persona' : 'edificio'}?id=${entidad_id}`;
    const contactos = Array.isArray(payload.contactos) && payload.contactos.length ? payload.contactos : extraerContactos(payload);

    const baseHtml = buildHtml({
      tipo: es ? tipoEs : tipoEn,
      nombre,
      estadoLabel: estado_label,
      estadoColor: estado_color,
      ubicacion,
      mensaje,
      contactos,
      profileLink,
      es,
    });
    const finalHtml = inyectarAntiExtorsion(baseHtml, es);

    const asunto = es
      ? `StatusVzla | ${tipoEs}: ${nombre}${estado_label ? ` — ${estado_label}` : ''}`
      : `StatusVzla | ${tipoEn}: ${nombre}${estado_label ? ` — ${estado_label}` : ''}`;

    let enviados = 0;
    for (const email of emails) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: asunto,
          body: finalHtml,
          from_name: 'StatusVzla',
        });
        enviados++;
      } catch (e) {
        console.warn(`Error enviando a ${email}: ${e.message}`);
      }
    }

    try {
      await asServiceRole.entities.LogNotificaciones.create({
        tipo, entidad_id, entidad_nombre: nombre || '',
        emails_enviados: enviados, accion: 'notificacion_general',
        detalles: `${asunto}${estado_label ? ` | estado: ${estado_label}` : ''}`,
      });
    } catch {}

    return Response.json({
      ok: true, enviados, total: emails.size, asunto,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
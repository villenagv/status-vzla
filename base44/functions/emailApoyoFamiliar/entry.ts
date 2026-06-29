import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildHTML(lang, p) {
  const es = lang !== 'en';
  const urgente = ['necesita_ayuda', 'atencion_urgente', 'herido'].includes(p.estado);
  const headerBg = urgente ? '#991B1B' : '#1E40AF';
  const titulo = es ? 'No estás solo/a. Estamos ayudando.' : "You're not alone. We're helping.";
  const badgeText = es
    ? (urgente ? '🆘 Necesita ayuda urgente' : '📍 Registrado en edificio')
    : (urgente ? '🆘 Needs urgent help' : '📍 Registered in building');
  const badgeBg = urgente ? '#FEF2F2' : '#EFF6FF';
  const badgeColor = urgente ? '#991B1B' : '#1E40AF';
  const badgeBorder = urgente ? '#FCA5A5' : '#BFDBFE';
  const edificioInfo = [p.nombre_edificio, p.direccion, p.ciudad].filter(Boolean).join(', ');

  const intro = es
    ? `Hemos registrado a <strong>${p.nombre_persona || 'una persona'}</strong> en el edificio <strong>${edificioInfo || 'reportado'}</strong>.`
    : `We have registered <strong>${p.nombre_persona || 'a person'}</strong> in the building <strong>${edificioInfo || 'reported'}</strong>.`;

  const cuerpo = es
    ? `Nuestro equipo y voluntarios están monitoreando este edificio en tiempo real.<br><br><strong>Recibirás un email automático cada vez que haya una actualización importante.</strong><br>No tienes que estar pendiente — nosotros te avisamos.`
    : `Our team and volunteers are monitoring this building in real time.<br><br><strong>You will automatically receive an email for every important update.</strong><br>You do not need to keep checking — we will notify you.`;

  const antifraude = es
    ? `⚠️ <strong>Nunca envíes dinero a cambio de información.</strong> Status Vzla no autoriza pagos ni rescates privados. Si alguien te pide dinero, repórtalo.`
    : `⚠️ <strong>Never send money in exchange for information.</strong> Status Vzla does not authorize payments or private rescues. If someone asks for money, report it.`;

  const linkBtn = es ? 'Ver actualizaciones del edificio →' : 'View building updates →';
  const pie = es
    ? 'Recibiste este email porque dejaron tu contacto al registrar a una persona en este edificio.'
    : 'You received this email because someone left your contact when registering a person in this building.';

  return `<!DOCTYPE html><html lang="${es ? 'es' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
<tr><td style="background:${headerBg};padding:24px 28px;">
  <p style="margin:0;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:0.05em;text-transform:uppercase;">Status Vzla · CRIS</p>
  <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#fff;line-height:1.3;">${titulo}</h1>
</td></tr>
<tr><td style="padding:20px 28px 0;">
  <span style="display:inline-block;background:${badgeBg};border:1.5px solid ${badgeBorder};border-radius:100px;padding:6px 16px;font-size:13px;font-weight:700;color:${badgeColor};">${badgeText}</span>
</td></tr>
<tr><td style="padding:16px 28px 0;">
  <p style="margin:0;font-size:15px;color:#111827;line-height:1.65;">${intro}</p>
</td></tr>
<tr><td style="padding:14px 28px 0;">
  <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:16px 18px;">
    <p style="margin:0;font-size:14px;color:#14532D;line-height:1.7;">${cuerpo}</p>
  </div>
</td></tr>
<tr><td style="padding:14px 28px 0;">
  <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;">
    <p style="margin:0;font-size:12px;color:#92400E;line-height:1.6;">${antifraude}</p>
  </div>
</td></tr>
${p.link_edificio ? `<tr><td style="padding:22px 28px 0;text-align:center;">
  <a href="${p.link_edificio}" style="display:inline-block;background:${headerBg};color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 30px;border-radius:12px;">${linkBtn}</a>
</td></tr>` : ''}
<tr><td style="padding:20px 28px 28px;">
  <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;border-top:1px solid #F3F4F6;padding-top:16px;">${pie}</p>
  <p style="margin:6px 0 0;font-size:11px;color:#D1D5DB;">© 2025 Status Vzla · ${es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email_familiar, nombre_persona, estado, edificio_id, nombre_edificio, direccion, ciudad, lang = 'es' } = body;

    if (!email_familiar || !edificio_id) {
      return Response.json({ error: 'email_familiar y edificio_id son requeridos' }, { status: 400 });
    }

    const es = lang !== 'en';
    const urgente = ['necesita_ayuda', 'atencion_urgente', 'herido'].includes(estado);
    const link_edificio = `https://statusvzla.com/edificio?id=${edificio_id}`;

    const asunto = es
      ? (urgente ? `🆘 Urgente — ${nombre_persona || 'persona'} en ${nombre_edificio || 'el edificio'}` : `📍 Registro confirmado — ${nombre_persona || 'persona'} en ${nombre_edificio || 'el edificio'}`)
      : (urgente ? `🆘 Urgent — ${nombre_persona || 'person'} in ${nombre_edificio || 'the building'}` : `📍 Confirmed — ${nombre_persona || 'person'} in ${nombre_edificio || 'the building'}`);

    const html = buildHTML(lang, { nombre_persona, estado, nombre_edificio, direccion, ciudad, link_edificio });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email_familiar,
      subject: asunto,
      body: html,
      from_name: 'Status Vzla',
    });

    await base44.asServiceRole.entities.LogNotificaciones.create({
      tipo: 'edificio',
      entidad_id: edificio_id,
      entidad_nombre: nombre_edificio || '',
      emails_enviados: 1,
      accion: 'email_apoyo_familiar',
      detalles: `email: ${email_familiar} | persona: ${nombre_persona || 'sin nombre'} | estado: ${estado}`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
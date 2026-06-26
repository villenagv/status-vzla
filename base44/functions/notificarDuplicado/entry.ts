import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://app.statusvzla.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Soporta llamada directa ({ persona_id, ... }) y payload de automatización de entidad ({ event, data })
    const persona_id = body.persona_id || body.event?.entity_id || body.data?.id;
    const nombre_completo = body.nombre_completo || body.data?.nombre_completo;
    const duplicado_de_id = body.duplicado_de_id || body.data?.duplicado_de_id;
    const lang = body.lang || body.data?.lang || 'es';

    if (!persona_id) return Response.json({ error: 'persona_id requerido' }, { status: 400 });

    const es = lang !== 'en';
    const nombre = nombre_completo || 'La persona buscada';

    // Recopilar emails suscritos a esta ficha
    const emails = new Set();

    const [seguimiento, porCuenta] = await Promise.all([
      base44.asServiceRole.entities.SuscriptoresSeguimiento.filter({ reporte_id: persona_id, activo: true }),
      base44.asServiceRole.entities.Suscripciones.filter({ persona_id, activa: true }),
    ]);

    for (const s of seguimiento) {
      const email = s.telefono_whatsapp?.trim();
      if (email && email.includes('@')) emails.add(email);
    }
    for (const s of porCuenta) {
      if (s.email_notificacion?.trim()) emails.add(s.email_notificacion.trim());
    }

    // También buscar el contacto de notificación en la ficha misma (avisar_email)
    try {
      const persona = await base44.asServiceRole.entities.PersonasBuscadas.get(persona_id);
      if (persona?.avisar_email?.trim()) emails.add(persona.avisar_email.trim());
      if (persona?.contacto_email?.trim()) emails.add(persona.contacto_email.trim());
    } catch {}

    if (emails.size === 0) {
      return Response.json({ ok: true, enviados: 0, motivo: 'sin_suscriptores' });
    }

    const profileLink = duplicado_de_id
      ? `${APP_URL}/persona?id=${duplicado_de_id}`
      : `${APP_URL}/personas`;

    const asunto = es
      ? `StatusVzla | ${nombre} — Registro unificado (posible duplicado)`
      : `StatusVzla | ${nombre} — Record merged (possible duplicate)`;

    const html = `<!DOCTYPE html><html lang="${es ? 'es' : 'en'}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${asunto}</title></head>
<body style="margin:0;padding:0;background:#F4F4F8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:24px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:#1A1F2E;padding:20px 28px;">
  <p style="margin:0;color:#fff;font-size:20px;font-weight:900;">STATUS<span style="color:#D48C2E;">VZLA</span><span style="color:#D48C2E;font-size:14px;">.com</span></p>
  <p style="margin:4px 0 0;color:#9CA3AF;font-size:11px;">${es ? 'Sistema de respuesta a emergencias · Venezuela' : 'Emergency response system · Venezuela'}</p>
</td></tr>
<tr><td style="padding:24px 28px 12px;">
  <div style="background:#FFF8EE;border:1px solid #E6C195;border-radius:12px;padding:18px;text-align:center;">
    <p style="margin:0;font-size:28px;">🔗</p>
    <h2 style="margin:8px 0 4px;font-size:18px;font-weight:900;color:#1A1F2E;">${nombre}</h2>
    <span style="display:inline-block;background:#7A5000;color:#fff;font-size:11px;font-weight:700;padding:3px 12px;border-radius:50px;">
      ${es ? 'Registro unificado' : 'Record merged'}
    </span>
  </div>
</td></tr>
<tr><td style="padding:8px 28px 16px;">
  <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
    ${es
      ? `Un moderador de <strong>StatusVzla</strong> identificó que la ficha de <strong>${nombre}</strong> aparecía duplicada en el sistema. Los dos registros han sido unificados para mostrar información más completa y precisa.`
      : `A <strong>StatusVzla</strong> moderator identified that the record for <strong>${nombre}</strong> was duplicated in the system. Both records have been merged to show more complete and accurate information.`}
  </p>
</td></tr>
<tr><td style="padding:0 28px 16px;">
  <div style="background:#F0F4FD;border:1px solid #B0C4E8;border-radius:10px;padding:14px;">
    <p style="margin:0;font-size:13px;color:#1A3A6E;line-height:1.5;">
      ℹ️ ${es
        ? 'Si tienes nueva información sobre esta persona, puedes seguir usando el enlace de abajo. Tus suscripciones anteriores siguen activas.'
        : 'If you have new information about this person, you can continue using the link below. Your previous subscriptions remain active.'}
    </p>
  </div>
</td></tr>
<tr><td style="padding:0 28px 16px;">
  <a href="${profileLink}" style="display:block;background:#1A1F2E;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:14px;">
    ${es ? '🔍 Ver ficha actualizada' : '🔍 View updated record'}
  </a>
</td></tr>
<tr><td style="padding:0 28px 16px;">
  <div style="background:#FDF1F0;border:1px solid #E8B4B0;border-radius:10px;padding:12px;">
    <p style="margin:0;font-size:11px;color:#B83A52;line-height:1.5;">
      ⚠️ ${es
        ? 'Nunca envíes dinero a cambio de información. STATUSVZLA.com no autoriza pagos ni rescates privados. Si alguien pide dinero, es una estafa.'
        : "Never send money in exchange for information. STATUSVZLA.com does not authorize payments or private rescue fees. If someone asks for money, it's a scam."}
    </p>
  </div>
</td></tr>
<tr><td style="background:#F9FAFB;padding:16px 28px;border-top:1px solid #F3F4F6;">
  <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;line-height:1.5;">
    ${es ? 'Mensaje automático de STATUSVZLA.com — Sistema de respuesta a emergencias.' : 'Automatic message from STATUSVZLA.com — Emergency response system.'}
  </p>
</td></tr>
</table></td></tr></table></body></html>`;

    let enviados = 0;
    for (const email of emails) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: asunto,
          body: html,
          from_name: 'StatusVzla',
        });
        enviados++;
      } catch (e) {
        console.warn(`Error enviando a ${email}: ${e.message}`);
      }
    }

    return Response.json({ ok: true, enviados, total: emails.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
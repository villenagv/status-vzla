import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';
const BANNER_URL = 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/2d268252b_ChatGPTImageJun29202612_43_55AM.png';

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

function buildCampaignBlock(es) {
  return `
<div style="background:linear-gradient(135deg,#0D2B6B 0%,#1A3A8F 50%,#0D2B6B 100%);border-radius:14px;padding:20px;text-align:center;border:2px solid #D48C2E;margin-top:16px;">
  <p style="margin:0 0 6px;font-size:13px;font-weight:900;color:#F59E0B;text-transform:uppercase;letter-spacing:0.05em;">
    ${es ? '📢 Ayúdanos a publicar esto en tus redes' : '📢 Help us share this on your networks'}
  </p>
  <p style="margin:0 0 12px;font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5;">
    ${es
      ? 'Descarga la imagen adjunta y compártela en WhatsApp, Instagram o Twitter. Tu difusión puede ayudar a que más personas reporten información.'
      : 'Download the attached image and share it on WhatsApp, Instagram or Twitter. Your sharing can help more people report information.'}
  </p>
  <div style="background:rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;text-align:left;margin-bottom:14px;">
    <p style="margin:0 0 3px;font-size:11px;color:#fff;">✅ ${es ? '1. Descarga la imagen adjunta.' : '1. Download the attached image.'}</p>
    <p style="margin:0 0 3px;font-size:11px;color:#fff;">✅ ${es ? '2. Compártela en tus redes.' : '2. Share it on your networks.'}</p>
    <p style="margin:0;font-size:11px;color:#fff;">✅ ${es ? '3. Invita a reportar en:' : '3. Invite to report at:'} <a href="${APP_URL}/edificios" style="color:#F59E0B;font-weight:700;text-decoration:none;">statusvzla.com/edificios</a></p>
  </div>
  <a href="${APP_URL}/edificios" style="display:inline-block;background:#F59E0B;color:#0D2B6B;text-decoration:none;font-size:12px;font-weight:900;padding:9px 22px;border-radius:10px;">
    🏗️ ${es ? 'Ver edificios →' : 'See buildings →'}
  </a>
</div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      email_destino, nombre_reportante, telefono_reportante, contacto_telefono,
      relacion, mensaje, codigo_cris, persona_id, nombre_persona, lang = 'es'
    } = await req.json();
    const es = lang !== 'en';

    if (!email_destino) return Response.json({ error: 'email_destino requerido' }, { status: 400 });

    const subject = es
      ? `📱 ${nombre_persona || 'Un familiar'} se registró en CRIS · StatusVzla`
      : `📱 ${nombre_persona || 'A family member'} registered in CRIS · StatusVzla`;

    const body = `<!DOCTYPE html>
<html lang="${es ? 'es' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f8;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:20px 16px">
<table width="100%" style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

<!-- HEADER -->
<tr><td style="background:#111318;padding:16px 24px">
  <span style="font-size:20px;font-weight:900;color:#ffffff">STATUS<span style="color:#D48C2E">VZLA</span> · CRIS</span>
  <p style="margin:4px 0 0;font-size:11px;color:#9CA3AF;">${es ? 'Sistema de respuesta a emergencias · Venezuela' : 'Emergency response system · Venezuela'}</p>
</td></tr>

<!-- CUERPO -->
<tr><td style="padding:24px 28px">

  <h2 style="font-size:20px;margin:0 0 8px;color:#1a1f2e">${es ? '✅ Reporte recibido' : '✅ Report received'}</h2>
  <p style="font-size:14px;color:#555;margin:0 0 18px;line-height:1.6">${
    es
      ? `<strong>${nombre_reportante || 'Alguien'}</strong> te envía este aviso desde la zona afectada.`
      : `<strong>${nombre_reportante || 'Someone'}</strong> sent you this message from the affected area.`
  }</p>

  <!-- Persona + relación -->
  <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;margin-bottom:14px;">
    ${nombre_persona ? `<p style="font-size:14px;font-weight:700;color:#1a1f2e;margin:0 0 6px">🙋 ${es ? 'Persona: ' : 'Person: '}<strong>${nombre_persona}</strong></p>` : ''}
    ${relacion ? `<p style="font-size:13px;color:#555;margin:0">🔗 ${es ? 'Relación: ' : 'Relationship: '}<strong>${relacion}</strong></p>` : ''}
  </div>

  <!-- Contacto del reporte -->
  ${(nombre_reportante || telefono_reportante || contacto_telefono) ? `
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-bottom:14px;">
    <p style="font-size:12px;font-weight:700;color:#166534;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">${es ? 'Contacto del reporte' : 'Report contact'}</p>
    ${nombre_reportante ? `<p style="font-size:13px;color:#374151;margin:0 0 4px">${es ? 'Nombre: ' : 'Name: '}<strong>${nombre_reportante}</strong></p>` : ''}
    ${(telefono_reportante || contacto_telefono) ? `<p style="font-size:13px;color:#374151;margin:0">${es ? 'Teléfono: ' : 'Phone: '}<strong>${telefono_reportante || contacto_telefono}</strong></p>` : ''}
    <p style="font-size:11px;color:#166534;margin:8px 0 0;line-height:1.4">${es ? 'Verifica la información antes de compartirla. Nunca envíes dinero.' : 'Verify this information before sharing it. Never send money.'}</p>
  </div>` : ''}

  <!-- Mensaje -->
  ${mensaje ? `<p style="font-size:14px;color:#1a1f2e;background:#fdfaeb;border:1px solid #f0e8c0;border-radius:10px;padding:14px;margin-bottom:14px;line-height:1.6">💬 &ldquo;${mensaje}&rdquo;</p>` : ''}

  <!-- Código CRIS -->
  ${codigo_cris ? `<p style="font-size:13px;color:#555;margin:0 0 14px">🆔 ${es ? 'Código CRIS: ' : 'CRIS Code: '}<strong style="color:#1a1f2e">${codigo_cris}</strong></p>` : ''}

  <!-- Botón ver persona -->
  ${persona_id ? `<a href="${APP_URL}/persona?id=${persona_id}" style="display:inline-block;background:#1a1f2e;color:#fff;padding:13px 22px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;margin-bottom:16px;">
    ${es ? '🔍 Ver perfil de la persona' : '🔍 View person profile'}
  </a>` : ''}

  <!-- Anti-fraude -->
  <div style="border-top:1px solid #eee;margin-top:16px;padding-top:14px">
    <p style="font-size:12px;color:#888;margin:0;line-height:1.5">⚠️ ${es
      ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios anónimos. Si alguien pide dinero, repórtalo.'
      : 'Never send money in exchange for information. This platform does not authorize payments, private rescue fees, or anonymous intermediaries. If someone asks for money, report it.'}</p>
  </div>

  <!-- Bloque campaña -->
  ${buildCampaignBlock(es)}

</td></tr>

<!-- FOOTER -->
<tr><td style="background:#f4f4f8;padding:12px 24px;font-size:11px;color:#999;text-align:center">
  StatusVzla · ${es ? 'Herramienta ciudadana y no partidista' : 'Citizen, non-partisan tool'}
</td></tr>

</table>
</td></tr></table></body></html>`;

    const attachment = await getBannerAttachment();
    const payload: any = { to: email_destino, subject, body, from_name: 'StatusVzla' };
    if (attachment) payload.attachments = [attachment];

    await base44.asServiceRole.integrations.Core.SendEmail(payload);

    try {
      await base44.asServiceRole.entities.LogNotificaciones.create({
        tipo: 'persona', entidad_id: persona_id || '', entidad_nombre: nombre_persona || '',
        emails_enviados: 1, accion: 'email_aviso_familiar',
        detalles: `email: ${email_destino}${relacion ? ` | relación: ${relacion}` : ''}${codigo_cris ? ` | CRIS: ${codigo_cris}` : ''}`,
      });
    } catch {}

    return Response.json({ ok: true, enviado_a: email_destino });
  } catch (error) {
    return Response.json({ error: 'Error enviando el aviso. Intenta de nuevo.' }, { status: 500 });
  }
});
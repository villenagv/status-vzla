import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email_destino, nombre_reportante, relacion, mensaje, codigo_cris, persona_id, nombre_persona, lang } = await req.json();
    const es = lang !== 'en';

    if (!email_destino) return Response.json({ error: 'email_destino requerido' }, { status: 400 });

    const subject = es
      ? `📱 ${nombre_persona || 'Un familiar'} se registró en CRIS · StatusVzla`
      : `📱 ${nombre_persona || 'A family member'} registered in CRIS · StatusVzla`;

    const body = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,sans-serif;background:#f4f4f8;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:20px 16px">
<table width="520" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">

<tr><td style="background:#111318;padding:16px 24px">
<span style="font-size:18px;font-weight:700;color:#ffffff">STATUS<span style="color:#c09a1a">VZLA</span> · CRIS</span>
</td></tr>

<tr><td style="padding:24px">
<h2 style="font-size:20px;margin:0 0 8px;color:#1a1f2e">${
  es ? '✅ Reporte recibido' : '✅ Report received'
}</h2>
<p style="font-size:14px;color:#555;margin:0 0 14px;line-height:1.6">${
  es
    ? `${nombre_reportante || 'Alguien'} te envía este mensaje desde la zona afectada.`
    : `${nombre_reportante || 'Someone'} sent you this message from the affected area.`
}</p>

${
  nombre_persona ? `<p style="font-size:14px;font-weight:600;color:#1a1f2e;margin:0 0 6px">🙋 ${
    es ? 'Persona: ' : 'Person: '
  }${nombre_persona}</p>` : ''
}
${
  relacion ? `<p style="font-size:14px;color:#555;margin:0 0 6px">🔗 ${es ? 'Relación: ' : 'Relationship: '}${relacion}</p>` : ''
}
${
  mensaje ? `<p style="font-size:14px;color:#1a1f2e;background:#fdfaeb;border:1px solid #f0e8c0;border-radius:8px;padding:12px;margin:12px 0;line-height:1.6">💬 “${mensaje}”</p>` : ''
}
${
  codigo_cris ? `<p style="font-size:14px;color:#555;margin:12px 0 6px">🆔 ${es ? 'Código CRIS: ' : 'CRIS Code: '}<span style="font-weight:700;color:#1a1f2e">${codigo_cris}</span></p>` : ''
}
${
  persona_id ? `<a href="https://statusvzla.com/persona?id=${persona_id}" style="display:inline-block;background:#1a1f2e;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin:16px 0">${
    es ? '🔍 Ver perfil de la persona' : '🔍 View person profile'
  }</a>` : ''
}

<div style="border-top:1px solid #eee;margin:20px 0;padding-top:16px">
<p style="font-size:13px;color:#888;margin:0 0 6px;line-height:1.5">⚠️ ${es
  ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios anónimos. Si alguien pide dinero, repórtalo.'
  : 'Never send money in exchange for information. This platform does not authorize payments, private rescue fees, or anonymous intermediaries. If someone asks for money, report it.'}</p>
</div>
</td></tr>

<tr><td style="background:#f4f4f8;padding:12px 24px;font-size:11px;color:#999;text-align:center">
StatusVzla · ${es ? 'Herramienta ciudadana y no partidista' : 'Citizen, non-partisan tool'}
</td></tr>

</table>
</td></tr></table></body></html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({ to: email_destino, subject, body });
    return Response.json({ ok: true, enviado_a: email_destino });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
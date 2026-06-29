import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * enviarEmailReportante
 *
 * Permite a un voluntario/especialista enviar un correo desde la plataforma
 * al reportante de una solicitud de inspección, sin exponer su email.
 * Registra el envío en LogNotificaciones para auditoría (portal + admin).
 *
 * Payload: { reporte_id, mensaje, asunto?, es? }
 */

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(inner: string) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0D2259;padding:18px 24px;">
      <span style="font-size:18px;font-weight:800;color:#fff;">📍 Status<span style="color:#F5C518;"> Vzla</span></span>
    </div>
    <div style="padding:24px;">${inner}</div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">Status Vzla · Plataforma ciudadana de emergencias · No partidista · Sin fines de lucro</p>
      <p style="font-size:11px;color:#9ca3af;margin:6px 0 0;">⚠️ Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni intermediarios.</p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reporte_id, mensaje, asunto, es = true } = await req.json().catch(() => ({}));
    if (!reporte_id || !mensaje?.trim()) {
      return Response.json({ error: 'Faltan datos (reporte_id, mensaje)' }, { status: 400 });
    }

    const rep = await base44.asServiceRole.entities.ReportesDano.get(reporte_id).catch(() => null);
    if (!rep) return Response.json({ error: 'Reporte no encontrado' }, { status: 404 });

    const destino = (rep.reportante_email || '').trim();
    if (!destino) return Response.json({ error: 'El reporte no tiene email de contacto' }, { status: 400 });

    const lugar = esc(rep.nombre_lugar || rep.direccion || rep.ciudad || (es ? 'tu estructura reportada' : 'your reported structure'));
    const remitente = esc(user.full_name || user.email || (es ? 'Equipo técnico' : 'Technical team'));

    const inner = es
      ? `<h1 style="font-size:19px;font-weight:800;color:#111827;margin:0 0 12px;">Mensaje del equipo técnico</h1>
         <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">Sobre tu solicitud de inspección de <b>${lugar}</b></p>
         <div style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">${esc(mensaje)}</div>
         <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">— ${remitente}, voluntario técnico de Status Vzla</p>`
      : `<h1 style="font-size:19px;font-weight:800;color:#111827;margin:0 0 12px;">Message from the technical team</h1>
         <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">Regarding your inspection request for <b>${lugar}</b></p>
         <div style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">${esc(mensaje)}</div>
         <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">— ${remitente}, Status Vzla technical volunteer</p>`;

    let enviado = 0;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: destino,
        from_name: 'Status Vzla',
        subject: asunto?.trim() || (es ? `Sobre tu inspección: ${rep.nombre_lugar || rep.ciudad || 'estructura'}` : `About your inspection: ${rep.nombre_lugar || rep.ciudad || 'structure'}`),
        body: wrap(inner),
      });
      enviado = 1;
    } catch (e) {
      return Response.json({ error: 'No se pudo enviar el email: ' + (e?.message || '') }, { status: 500 });
    }

    // Log de auditoría — visible en portal y admin
    await base44.asServiceRole.entities.LogNotificaciones.create({
      tipo: 'edificio',
      entidad_id: reporte_id,
      entidad_nombre: rep.nombre_lugar || rep.direccion || rep.ciudad || '—',
      emails_enviados: enviado,
      accion: 'email_manual_especialista',
      detalles: `${remitente} envió un mensaje al reportante (${destino}). Asunto: ${asunto?.trim() || 'inspección'}.`,
    }).catch(() => {});

    return Response.json({ ok: true, emails_enviados: enviado });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
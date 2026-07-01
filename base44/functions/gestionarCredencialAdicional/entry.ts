import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';

const TIPO_LABEL_ES = {
  titulo: 'Título profesional',
  carnet: 'Carnet de colegiado',
  certificacion: 'Certificación profesional',
  identificacion: 'Identificación',
  otro: 'Documento adicional',
};

const EMAIL_SOLICITUD_ES = (nombre, tipoLabel, link) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:#0D2259;border-radius:16px;padding:24px;text-align:center;margin-bottom:16px;">
    <p style="font-size:32px;margin:0 0 8px;">📄</p>
    <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 6px;">Necesitamos un documento adicional</h1>
    <p style="color:#93C5FD;font-size:13px;margin:0;">Status Venezuela · Equipo de voluntarios y especialistas</p>
  </div>
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:16px;">
    <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 8px;">Hola, ${nombre || 'equipo CRIS'}:</p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Para completar la validación de tu perfil profesional, necesitamos que subas: <strong>${tipoLabel}</strong>.
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Toca el botón para subir tu documento. Es un enlace personal solo para ti.
    </p>
    <a href="${link}" style="display:block;background:#1d4ed8;color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-weight:700;font-size:14px;margin-bottom:8px;">
      📄 Subir documento →
    </a>
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">Este enlace es personal e intransferible.</p>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;">
    CRIS · Status Venezuela · Plataforma ciudadana, no partidista y sin fines de lucro.
  </p>
</div>
</body>
</html>
`.trim();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { accion } = body;

    // ── ADMIN: solicitar credencial adicional a un perfil específico ──
    if (accion === 'enviar_solicitud') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      const { perfil_id, tipo_documento } = body;
      if (!perfil_id || !tipo_documento) return Response.json({ error: 'Faltan datos' }, { status: 400 });

      const perfil = await base44.asServiceRole.entities.PerfilProfesional.get(perfil_id).catch(() => null);
      if (!perfil) return Response.json({ error: 'Perfil no encontrado' }, { status: 404 });
      if (!perfil.user_email) return Response.json({ error: 'El perfil no tiene email' }, { status: 400 });

      const token = crypto.randomUUID().replace(/-/g, '');
      await base44.asServiceRole.entities.PerfilProfesional.update(perfil.id, {
        token_credencial_adicional: token,
        token_credencial_usado: false,
        tipo_credencial_solicitada: tipo_documento,
      });

      const link = `${APP_URL}/subir-credencial?token=${token}`;
      const tipoLabel = TIPO_LABEL_ES[tipo_documento] || TIPO_LABEL_ES.otro;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: perfil.user_email,
        subject: '📄 Necesitamos un documento adicional — CRIS',
        from_name: 'CRIS StatusVzla',
        body: EMAIL_SOLICITUD_ES(perfil.user_nombre, tipoLabel, link),
      });

      return Response.json({ ok: true });
    }

    // ── VALIDAR token (público, sin login) ──
    if (accion === 'validar_token') {
      const { token } = body;
      if (!token) return Response.json({ valido: false });

      const lista = await base44.asServiceRole.entities.PerfilProfesional.filter({ token_credencial_adicional: token });
      const perfil = lista?.[0];
      if (!perfil) return Response.json({ valido: false, error: 'Token inválido' });
      if (perfil.token_credencial_usado) return Response.json({ valido: false, error: 'Este enlace ya fue usado' });

      return Response.json({
        valido: true,
        nombre: perfil.user_nombre || perfil.user_email,
        tipo_documento: perfil.tipo_credencial_solicitada,
      });
    }

    // ── SUBIR credencial vía token (público, sin login) ──
    if (accion === 'subir_credencial') {
      const { token, file_url } = body;
      if (!token || !file_url) return Response.json({ error: 'Faltan datos' }, { status: 400 });

      const lista = await base44.asServiceRole.entities.PerfilProfesional.filter({ token_credencial_adicional: token });
      const perfil = lista?.[0];
      if (!perfil) return Response.json({ error: 'Token inválido' }, { status: 404 });
      if (perfil.token_credencial_usado) return Response.json({ error: 'Este enlace ya fue usado' }, { status: 400 });

      const documentos = Array.isArray(perfil.documentos_validacion) ? perfil.documentos_validacion : [];
      const nuevos = [
        ...documentos.filter(d => d.tipo !== perfil.tipo_credencial_solicitada),
        { tipo: perfil.tipo_credencial_solicitada, url: file_url },
      ];

      await base44.asServiceRole.entities.PerfilProfesional.update(perfil.id, {
        documentos_validacion: nuevos,
        token_credencial_usado: true,
      });

      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
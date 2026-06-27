import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { accion } = body;

    // ── APROBAR usuario ──
    if (accion === 'aprobar') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { solicitud_id } = body;

      const sol = await base44.asServiceRole.entities.SolicitudVoluntario.get(solicitud_id);
      if (!sol) return Response.json({ error: 'Solicitud no encontrada' }, { status: 404 });

      await base44.asServiceRole.entities.SolicitudVoluntario.update(solicitud_id, {
        estado: 'aprobado',
        revisado_por: user.email,
      });

      if (sol.user_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: sol.user_email,
          subject: '✅ Tu acceso como voluntario fue aprobado — CRIS',
          from_name: 'CRIS StatusVzla',
          body: `Hola ${sol.user_nombre || sol.user_email},\n\n¡Tu cuenta de voluntario en Status Venezuela CRIS ha sido activada!\n\nYa puedes acceder al Portal de Voluntarios en: ${APP_URL}/portal-voluntario\n\n---\nPlataforma ciudadana, no partidista y sin fines de lucro.\nNunca envíes dinero a cambio de información.`,
        }).catch(() => {});
      }

      return Response.json({ ok: true, accion: 'aprobado' });
    }

    // ── RECHAZAR usuario ──
    if (accion === 'rechazar') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { solicitud_id, motivo_rechazo } = body;

      const sol = await base44.asServiceRole.entities.SolicitudVoluntario.get(solicitud_id);
      if (!sol) return Response.json({ error: 'Solicitud no encontrada' }, { status: 404 });

      await base44.asServiceRole.entities.SolicitudVoluntario.update(solicitud_id, {
        estado: 'rechazado',
        motivo_rechazo: motivo_rechazo || '',
        revisado_por: user.email,
      });

      if (sol.user_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: sol.user_email,
          subject: 'Tu solicitud de voluntario — CRIS',
          from_name: 'CRIS StatusVzla',
          body: `Hola ${sol.user_nombre || sol.user_email},\n\nEn este momento no pudimos aprobar tu solicitud como voluntario en CRIS.\n${motivo_rechazo ? `\nMotivo: ${motivo_rechazo}\n` : ''}\nSi crees que es un error, contáctanos.\n\n---\nPlataforma ciudadana, no partidista y sin fines de lucro.`,
        }).catch(() => {});
      }

      return Response.json({ ok: true, accion: 'rechazado' });
    }

    // ── CREAR token de invitación ──
    if (accion === 'crear_token') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { institucion_nombre, institucion_tipo, max_usos, dominio_email, notas } = body;

      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 20);
      const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const invitacion = await base44.asServiceRole.entities.InvitacionInstitucional.create({
        token,
        institucion_nombre: institucion_nombre || 'Institución aliada',
        institucion_tipo: institucion_tipo || '',
        dominio_email: dominio_email || '',
        max_usos: max_usos || 100,
        usos_actuales: 0,
        activo: true,
        expira_en: expira,
        creado_por: user.email,
        notas: notas || '',
      });

      const link = `${APP_URL}/voluntario?token=${token}`;
      return Response.json({ ok: true, token, link, invitacion });
    }

    // ── VALIDAR token ──
    if (accion === 'validar_token') {
      const { token } = body;
      if (!token) return Response.json({ valido: false });

      const lista = await base44.asServiceRole.entities.InvitacionInstitucional.filter({ token, activo: true });
      const inv = lista?.[0];

      if (!inv) return Response.json({ valido: false, error: 'Token inválido' });
      if (inv.expira_en && new Date(inv.expira_en) < new Date()) return Response.json({ valido: false, error: 'Token expirado' });
      if (inv.usos_actuales >= inv.max_usos) return Response.json({ valido: false, error: 'Token agotado' });

      return Response.json({
        valido: true,
        institucion_nombre: inv.institucion_nombre,
        institucion_tipo: inv.institucion_tipo,
      });
    }

    // ── REGISTRAR solicitud de voluntario (post OTP) ──
    if (accion === 'registrar_solicitud') {
      const { token_invitacion, institucion_nombre, foto_id_url } = body;

      const existentes = await base44.asServiceRole.entities.SolicitudVoluntario.filter({ user_id: user.id });
      if (existentes?.length > 0) {
        return Response.json({ ok: true, estado: existentes[0].estado, ya_existe: true });
      }

      let pre_aprobado = false;
      let inst_nombre = institucion_nombre || '';
      let inst_tipo = '';

      // Verificar token de invitación
      if (token_invitacion) {
        const lista = await base44.asServiceRole.entities.InvitacionInstitucional.filter({ token: token_invitacion, activo: true });
        const inv = lista?.[0];
        if (inv && new Date(inv.expira_en) > new Date() && inv.usos_actuales < inv.max_usos) {
          pre_aprobado = true;
          inst_nombre = inv.institucion_nombre;
          inst_tipo = inv.institucion_tipo;
          await base44.asServiceRole.entities.InvitacionInstitucional.update(inv.id, {
            usos_actuales: (inv.usos_actuales || 0) + 1,
          });
        }
      }

      // Verificar por dominio de email
      if (!pre_aprobado && user.email) {
        const dominio = user.email.split('@')[1]?.toLowerCase();
        if (dominio) {
          const porDominio = await base44.asServiceRole.entities.InvitacionInstitucional.filter({ dominio_email: dominio, activo: true });
          const match = porDominio?.[0];
          if (match) {
            pre_aprobado = true;
            inst_nombre = inst_nombre || match.institucion_nombre;
            inst_tipo = inst_tipo || match.institucion_tipo;
          }
        }
      }

      const sol = await base44.asServiceRole.entities.SolicitudVoluntario.create({
        user_id: user.id,
        user_email: user.email,
        user_nombre: user.full_name || '',
        estado: pre_aprobado ? 'aprobado' : 'pendiente',
        rol_solicitado: 'voluntario',
        institucion_nombre: inst_nombre,
        institucion_tipo: inst_tipo,
        foto_id_url: foto_id_url || '',
        token_invitacion: token_invitacion || '',
        pre_aprobado,
      });

      // Notificar admin de nueva solicitud pendiente
      if (!pre_aprobado) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'villenagv@gmail.com',
          subject: `🔔 Nueva solicitud de voluntario — ${user.email}`,
          from_name: 'CRIS Admin',
          body: `Nueva solicitud de voluntario pendiente.\n\nEmail: ${user.email}\nNombre: ${user.full_name || '—'}\nInstitución: ${inst_nombre || '—'}\n\nVer en: ${APP_URL}/admin`,
        }).catch(() => {});
      }

      return Response.json({ ok: true, estado: sol.estado, pre_aprobado });
    }

    return Response.json({ error: 'Acción no reconocida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
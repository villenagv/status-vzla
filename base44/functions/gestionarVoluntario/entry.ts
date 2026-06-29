import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://statusvzla.com';

const EMAIL_BIENVENIDA_ES = (nombre) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <div style="background:#1e293b;border-radius:16px;padding:24px;text-align:center;margin-bottom:16px;">
    <p style="font-size:32px;margin:0 0 8px;">⚙️</p>
    <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 6px;">¡Bienvenido/a al equipo de especialistas CRIS!</h1>
    <p style="color:#94a3b8;font-size:13px;margin:0;">Status Venezuela · Plataforma de respuesta a emergencias</p>
  </div>

  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:16px;">
    <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 8px;">Hola, ${nombre || 'especialista'}:</p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Tu perfil como <strong>ingeniero/arquitecto</strong> ha sido <strong style="color:#16a34a;">aprobado oficialmente</strong>. 
      Ya cuentas con acceso pleno al Centro de Inspecciones y todas las herramientas técnicas de la plataforma.
    </p>
    <a href="${APP_URL}/inspecciones" style="display:block;background:#1d4ed8;color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-weight:700;font-size:14px;margin-bottom:16px;">
      🏗️ Ir al Centro de Inspecciones →
    </a>
  </div>

  <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#92400e;font-size:13px;font-weight:800;margin:0 0 10px;">📢 COMUNICADO INSTITUCIONAL URGENTE</p>
    <p style="color:#78350f;font-size:13px;line-height:1.6;margin:0 0 10px;">
      Desde la mañana de hoy hemos iniciado formalmente el proceso de <strong>acoplamiento técnico de nuestra plataforma con otras organizaciones y sistemas</strong> que están trabajando en la emergencia. El objetivo es unificar esfuerzos y optimizar los datos de inspección a nivel nacional.
    </p>
    <p style="color:#78350f;font-size:13px;line-height:1.6;margin:0;">
      Los detalles técnicos, cambios en protocolos y nuevas funcionalidades se informarán en tiempo real a través de nuestros canales oficiales. Es fundamental que estés conectado/a.
    </p>
  </div>

  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#14532d;font-size:13px;font-weight:800;margin:0 0 12px;">📌 Canales oficiales del equipo:</p>
    
    <div style="margin-bottom:12px;">
      <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 4px;">💬 Grupo de coordinación técnica (WhatsApp):</p>
      <a href="https://chat.whatsapp.com/Iav9GC5hlvc3SQQkUnm0wj" style="color:#1d4ed8;font-size:13px;word-break:break-all;">
        https://chat.whatsapp.com/Iav9GC5hlvc3SQQkUnm0wj
      </a>
      <p style="color:#6b7280;font-size:11px;margin:2px 0 0;">Únete de inmediato. Aquí informaremos sobre cambios y coordinación.</p>
    </div>

    <div style="margin-bottom:12px;">
      <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 4px;">📞 Contacto directo del equipo:</p>
      <p style="color:#1e293b;font-size:13px;margin:0;"><strong>+1 (801) 231-0953</strong></p>
      <p style="color:#6b7280;font-size:11px;margin:2px 0 0;">Para emergencias logísticas y coordinación urgente.</p>
    </div>

    <div>
      <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 4px;">📱 Síguenos en redes sociales:</p>
      <p style="color:#1e293b;font-size:13px;margin:0;"><strong>@statusvzlacom</strong></p>
      <p style="color:#6b7280;font-size:11px;margin:2px 0 0;">Comunicados oficiales, actualizaciones y coordinación pública.</p>
    </div>
  </div>

  <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin-bottom:16px;">
    <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;">
      🔒 Tu labor es vital para validar la integridad estructural y priorizar la seguridad en esta emergencia. 
      Gracias por poner tu conocimiento técnico al servicio de la vida.<br><br>
      ⚠️ <strong>Importante:</strong> Nunca entres a estructuras dañadas sin autorización. 
      Si hay grietas graves, colapso, olor a gas, cables caídos o personas atrapadas, espera a las autoridades.
    </p>
  </div>

  <p style="text-align:center;color:#94a3b8;font-size:11px;">
    CRIS · Status Venezuela · Plataforma ciudadana, no partidista y sin fines de lucro.<br>
    Nunca envíes dinero a cambio de información.
  </p>
</div>
</body>
</html>
`.trim();

const EMAIL_BIENVENIDA_EN = (nombre) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <div style="background:#1e293b;border-radius:16px;padding:24px;text-align:center;margin-bottom:16px;">
    <p style="font-size:32px;margin:0 0 8px;">⚙️</p>
    <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 6px;">Welcome to the CRIS specialist team!</h1>
    <p style="color:#94a3b8;font-size:13px;margin:0;">Status Venezuela · Emergency response platform</p>
  </div>

  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:16px;">
    <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 8px;">Hello, ${nombre || 'specialist'}:</p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Your profile as an <strong>engineer/architect</strong> has been <strong style="color:#16a34a;">officially approved</strong>. 
      You now have full access to the Inspection Center and all technical tools on the platform.
    </p>
    <a href="${APP_URL}/inspecciones" style="display:block;background:#1d4ed8;color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-weight:700;font-size:14px;margin-bottom:16px;">
      🏗️ Go to Inspection Center →
    </a>
  </div>

  <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#92400e;font-size:13px;font-weight:800;margin:0 0 10px;">📢 INSTITUTIONAL ANNOUNCEMENT</p>
    <p style="color:#78350f;font-size:13px;line-height:1.6;margin:0 0 10px;">
      As of this morning, we have formally started the process of <strong>technical integration of our platform with other organizations and systems</strong> working on the emergency, aiming to unify efforts and optimize inspection data nationwide.
    </p>
    <p style="color:#78350f;font-size:13px;line-height:1.6;margin:0;">
      Technical details, protocol changes, and new features will be shared in real time through our official channels. It is essential that you stay connected.
    </p>
  </div>

  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#14532d;font-size:13px;font-weight:800;margin:0 0 12px;">📌 Official team channels:</p>
    
    <div style="margin-bottom:12px;">
      <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 4px;">💬 Technical coordination group (WhatsApp):</p>
      <a href="https://chat.whatsapp.com/Iav9GC5hlvc3SQQkUnm0wj" style="color:#1d4ed8;font-size:13px;word-break:break-all;">
        https://chat.whatsapp.com/Iav9GC5hlvc3SQQkUnm0wj
      </a>
      <p style="color:#6b7280;font-size:11px;margin:2px 0 0;">Join immediately. Updates and coordination will be shared here.</p>
    </div>

    <div style="margin-bottom:12px;">
      <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 4px;">📞 Direct team contact:</p>
      <p style="color:#1e293b;font-size:13px;margin:0;"><strong>+1 (801) 231-0953</strong></p>
      <p style="color:#6b7280;font-size:11px;margin:2px 0 0;">For logistics emergencies and urgent coordination.</p>
    </div>

    <div>
      <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 4px;">📱 Follow us on social media:</p>
      <p style="color:#1e293b;font-size:13px;margin:0;"><strong>@statusvzlacom</strong></p>
      <p style="color:#6b7280;font-size:11px;margin:2px 0 0;">Official announcements, updates, and public coordination.</p>
    </div>
  </div>

  <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin-bottom:16px;">
    <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;">
      🔒 Your work is vital to validate structural integrity and prioritize safety in this emergency. 
      Thank you for putting your technical knowledge at the service of life.<br><br>
      ⚠️ <strong>Important:</strong> Never enter damaged structures without authorization. 
      If there are major cracks, collapse, gas smell, fallen wires, or trapped people, wait for authorities.
    </p>
  </div>

  <p style="text-align:center;color:#94a3b8;font-size:11px;">
    CRIS · Status Venezuela · Citizen, non-partisan, non-profit platform.<br>
    Never send money in exchange for information.
  </p>
</div>
</body>
</html>
`.trim();

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

      // Si es ingeniero o arquitecto, aprobar también el PerfilProfesional
      const esEspecialista = ['ingeniero', 'arquitecto'].includes(sol.rol_solicitado);
      if (esEspecialista) {
        const perfiles = await base44.asServiceRole.entities.PerfilProfesional.filter({ user_id: sol.user_id });
        if (perfiles?.length > 0) {
          await base44.asServiceRole.entities.PerfilProfesional.update(perfiles[0].id, {
            estado_aprobacion: 'aprobado',
            aprobado_por: user.email,
          });
        }
      }

      if (sol.user_email) {
        // Determinar idioma por heurística (si tiene nombre completo en inglés o sin acento, enviar en inglés)
        // Por defecto enviamos en español (la mayoría de los usuarios son venezolanos)
        const htmlBody = esEspecialista
          ? EMAIL_BIENVENIDA_ES(sol.user_nombre || sol.user_email)
          : `Hola ${sol.user_nombre || sol.user_email},\n\n¡Tu cuenta de voluntario en Status Venezuela CRIS ha sido activada!\n\nYa puedes acceder al Portal de Voluntarios en: ${APP_URL}/portal-voluntario\n\n💬 Únete al grupo de coordinación: https://chat.whatsapp.com/Iav9GC5hlvc3SQQkUnm0wj\n📞 Contacto: +1 (801) 231-0953\n📱 Síguenos: @statusvzlacom\n\n---\nPlataforma ciudadana, no partidista y sin fines de lucro.\nNunca envíes dinero a cambio de información.`;

        const subject = esEspecialista
          ? '✅ ¡Acceso aprobado! Bienvenido/a al equipo de especialistas CRIS — Comunicado Institucional'
          : '✅ Tu acceso como voluntario fue aprobado — CRIS';

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: sol.user_email,
          subject,
          from_name: 'CRIS StatusVzla',
          body: htmlBody,
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

    // ── REGISTRAR solicitud de voluntario ──
    if (accion === 'registrar_solicitud') {
      const { token_invitacion, institucion_nombre, foto_id_url, tipo_perfil, especialidad, numero_colegio, telefono_contacto } = body;

      const existentes = await base44.asServiceRole.entities.SolicitudVoluntario.filter({ user_id: user.id });
      if (existentes?.length > 0) {
        return Response.json({ ok: true, estado: existentes[0].estado, ya_existe: true });
      }

      let pre_aprobado = false;
      let inst_nombre = institucion_nombre || '';
      let inst_tipo = '';

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

      const perfilTipo = tipo_perfil || 'voluntario';
      const esEspecialista = perfilTipo === 'ingeniero' || perfilTipo === 'arquitecto';

      const sol = await base44.asServiceRole.entities.SolicitudVoluntario.create({
        user_id: user.id,
        user_email: user.email,
        user_nombre: user.full_name || '',
        telefono_contacto: telefono_contacto || '',
        estado: (pre_aprobado && !esEspecialista) ? 'aprobado' : 'pendiente',
        rol_solicitado: perfilTipo,
        institucion_nombre: inst_nombre,
        institucion_tipo: inst_tipo,
        foto_id_url: foto_id_url || '',
        token_invitacion: token_invitacion || '',
        pre_aprobado: pre_aprobado && !esEspecialista,
      });

      const perfilesExistentes = await base44.asServiceRole.entities.PerfilProfesional.filter({ user_id: user.id });
      const perfilData = {
        user_id: user.id,
        user_email: user.email,
        user_nombre: user.full_name || '',
        telefono_contacto: telefono_contacto || '',
        tipo_perfil: perfilTipo,
        especialidad: especialidad || '',
        numero_colegio: numero_colegio || '',
        institucion: inst_nombre || '',
        estado_aprobacion: esEspecialista ? 'pendiente' : 'aprobado',
        completado: true,
      };
      if (perfilesExistentes?.length > 0) {
        await base44.asServiceRole.entities.PerfilProfesional.update(perfilesExistentes[0].id, perfilData);
      } else {
        await base44.asServiceRole.entities.PerfilProfesional.create(perfilData);
      }

      if (esEspecialista || !pre_aprobado) {
        const tipoLabel = perfilTipo === 'ingeniero' ? '⚙️ Ingeniero' : perfilTipo === 'arquitecto' ? '📐 Arquitecto' : '🤝 Voluntario';
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'villenagv@gmail.com',
          subject: `🔔 Nueva solicitud: ${tipoLabel} — ${user.email}`,
          from_name: 'CRIS Admin',
          body: `Nueva solicitud pendiente.\n\nTipo: ${tipoLabel}\nEmail: ${user.email}\nNombre: ${user.full_name || '—'}\nTeléfono: ${telefono_contacto || '—'}\nEspecialidad: ${especialidad || '—'}\nN° Colegio: ${numero_colegio || '—'}\nInstitución: ${inst_nombre || '—'}\n\nVer en: ${APP_URL}/admin`,
        }).catch(() => {});
      }

      return Response.json({ ok: true, estado: sol.estado, pre_aprobado: pre_aprobado && !esEspecialista, tipo_perfil: perfilTipo });
    }

    return Response.json({ error: 'Acción no reconocida' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
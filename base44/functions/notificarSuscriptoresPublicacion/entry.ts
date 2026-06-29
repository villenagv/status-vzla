import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Solo voluntarios aprobados o admins
    if (user.role !== 'admin') {
      const perfiles = await base44.asServiceRole.entities.PerfilProfesional.filter({ user_id: user.id });
      const perfil = perfiles?.[0];
      if (!perfil || perfil.estado_aprobacion !== 'aprobado') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { edificio_id, asunto, mensaje, remitente_nombre } = body;

    if (!edificio_id || !mensaje) {
      return Response.json({ error: 'edificio_id y mensaje son requeridos' }, { status: 400 });
    }

    // Obtener el edificio
    const edificio = await base44.asServiceRole.entities.ReportesDano.get(edificio_id);
    if (!edificio) return Response.json({ error: 'Edificio no encontrado' }, { status: 404 });

    // Obtener suscriptores
    const suscriptores = await base44.asServiceRole.entities.SuscriptoresSeguimiento.filter({
      reporte_id: edificio_id,
      activo: true
    });

    if (!suscriptores || suscriptores.length === 0) {
      return Response.json({ enviados: 0, mensaje: 'No hay suscriptores para esta publicación' });
    }

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    let enviados = 0;
    const errores = [];

    const nombreEdificio = edificio.nombre_lugar || edificio.direccion || 'Edificio';
    const asuntoEmail = asunto || `Actualización sobre ${nombreEdificio} — Status Vzla`;

    for (const suscriptor of suscriptores) {
      const email = suscriptor.telefono_whatsapp; // campo usado para email
      if (!email || !email.includes('@')) continue;

      const cuerpo = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;padding:20px;margin:0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
    <div style="background:#1A1F2E;padding:20px 24px;">
      <p style="color:#F5C518;font-size:11px;font-weight:800;letter-spacing:0.06em;margin:0 0 4px;">📍 STATUS VZLA</p>
      <h2 style="color:#fff;margin:0;font-size:18px;">${nombreEdificio}</h2>
      <p style="color:#aaa;font-size:12px;margin:4px 0 0;">${edificio.direccion || ''} · ${edificio.ciudad || ''}</p>
    </div>
    <div style="padding:24px;">
      <div style="background:#FEF9E7;border:1px solid #F9E79F;border-radius:10px;padding:14px 16px;margin-bottom:18px;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#B7950B;">ACTUALIZACIÓN DEL EQUIPO</p>
        <p style="margin:8px 0 0;font-size:14px;color:#333;line-height:1.6;">${mensaje.replace(/\n/g, '<br>')}</p>
        ${remitente_nombre ? `<p style="margin:10px 0 0;font-size:11px;color:#888;">— ${remitente_nombre}</p>` : ''}
      </div>
      <p style="font-size:12px;color:#555;margin-bottom:6px;">
        Nivel de daño actual: <strong>${edificio.nivel_dano || 'Sin evaluar'}</strong>
      </p>
      ${['grave','critico','colapsado'].includes(edificio.nivel_dano) ?
        '<div style="background:#FDEDEC;border:1px solid #F5B7B1;border-radius:8px;padding:10px 14px;margin:12px 0;"><p style="margin:0;font-size:12px;font-weight:700;color:#C0392B;">🚫 NO ENTRAR — Estructura no segura. Espera autorización de autoridades.</p></div>' : ''}
      <a href="https://app.base44.com/edificio?id=${edificio_id}" 
         style="display:block;background:#1A1F2E;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;margin-top:18px;">
        Ver ficha completa →
      </a>
    </div>
    <div style="background:#f9f9f9;padding:14px 24px;border-top:1px solid #eee;">
      <p style="margin:0;font-size:10px;color:#aaa;line-height:1.5;">
        Recibes este correo porque te suscribiste a actualizaciones de este edificio en Status Vzla.<br>
        Esta plataforma es ciudadana y no partidista. Nunca envíes dinero a cambio de información.
      </p>
    </div>
  </div>
</body>
</html>`;

      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'StatusVzla <no-reply@statusvzla.com>',
            to: [email],
            subject: asuntoEmail,
            html: cuerpo,
          }),
        });
        if (resp.ok) enviados++;
        else errores.push({ email, status: resp.status });
      } catch (e) {
        errores.push({ email, error: e.message });
      }
    }

    try {
      await base44.asServiceRole.entities.LogNotificaciones.create({
        tipo: 'edificio', entidad_id: edificio_id, entidad_nombre: nombreEdificio,
        emails_enviados: enviados, accion: 'notificacion_publicacion',
        detalles: `${asuntoEmail}${remitente_nombre ? ` | por: ${remitente_nombre}` : ''}`,
      });
    } catch {}

    return Response.json({ enviados, total_suscriptores: suscriptores.length, errores });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
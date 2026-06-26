import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generate a random token
function genToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let t = '';
  for (let i = 0; i < 32; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { persona_id, tipo_evento, datos_persona } = await req.json();

    if (!persona_id) return Response.json({ error: 'persona_id requerido' }, { status: 400 });

    const subs = await base44.asServiceRole.entities.Suscripciones.filter({ persona_id, activa: true });
    if (!subs || subs.length === 0) return Response.json({ ok: true, notificados: 0 });

    const nombre = datos_persona?.nombre_completo || 'La persona';
    const estado = datos_persona?.estado_caso || '';
    const estadoLabel = {
      buscando: 'Buscando información',
      informacion_recibida: 'Información recibida',
      visto_no_confirmado: 'Visto/a – no confirmado',
      encontrado_con_vida: '✅ Encontrado/a con vida',
      en_hospital_refugio: 'En hospital o refugio',
      fallecido_reportado: 'Fallecimiento reportado',
      caso_cerrado: 'Caso cerrado',
    }[estado] || estado;

    const esNueva = tipo_evento === 'nueva_busqueda';
    const esEncontrada = tipo_evento === 'persona_encontrada';

    const asunto = esNueva
      ? `Nueva búsqueda registrada: ${nombre}`
      : esEncontrada
        ? `¡Hay información sobre ${nombre}!`
        : `Actualización: ${nombre} — ${estadoLabel}`;

    const APP_URL = 'https://app.statusvzla.com';

    let notificados = 0;
    for (const sub of subs) {
      // Generate a single-use auto-update token for the person themselves
      const token = genToken();
      const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      await base44.asServiceRole.entities.TokensAutoUpdate.create({
        token,
        persona_id,
        email_destino: sub.email_notificacion,
        usado: false,
        expira,
      });

      const updateLink = `${APP_URL}/actualizar-estado?token=${token}`;

      const cuerpoBase = esNueva
        ? `Se registró una nueva búsqueda de ${nombre}. Si esta persona eres tú o tiene acceso a este correo, puede actualizar su ubicación y estado directamente con el enlace de abajo.`
        : esEncontrada
          ? `Alguien reportó información sobre ${nombre}. Revisa los detalles en STATUSVZLA.com.`
          : `El estado de ${nombre} fue actualizado a: ${estadoLabel}.`;

      const cuerpo = `${cuerpoBase}

📍 Si eres ${nombre} o tienes acceso a actualizar esta información, usa este enlace seguro (válido 7 días, no requiere contraseña):
${updateLink}

⚠️ Nunca envíes dinero a cambio de información. STATUSVZLA.com no autoriza pagos ni rescates privados. Si alguien pide dinero, repórtalo.

— Equipo STATUSVZLA.com`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sub.email_notificacion,
        subject: asunto,
        body: cuerpo,
        from_name: 'STATUSVZLA.com',
      });

      await base44.asServiceRole.entities.NotificacionesUsuario.create({
        user_id: sub.user_id,
        tipo: tipo_evento,
        titulo: asunto,
        mensaje: cuerpoBase,
        leida: false,
        ref_id: persona_id,
        link_ref: `/actualizar-estado?token=${token}`,
      });

      notificados++;
    }

    return Response.json({ ok: true, notificados });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { persona_id, tipo_evento, datos_persona } = await req.json();

    if (!persona_id) return Response.json({ error: 'persona_id requerido' }, { status: 400 });

    // Get all subscriptions for this person
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

    const asunto = tipo_evento === 'nueva_busqueda'
      ? `Nueva búsqueda registrada: ${nombre}`
      : `Actualización: ${nombre} — ${estadoLabel}`;

    const cuerpo = tipo_evento === 'nueva_busqueda'
      ? `Se registró una nueva búsqueda de ${nombre}. Ingresa a STATUSVZLA.com para ver más información y confirmar si ya existe una ficha de esta persona.`
      : `El estado de ${nombre} fue actualizado a: ${estadoLabel}.\n\nIngresa a STATUSVZLA.com para ver la información completa.`;

    let notificados = 0;
    for (const sub of subs) {
      // Send email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sub.email_notificacion,
        subject: asunto,
        body: `${cuerpo}\n\n⚠️ Nunca envíes dinero a cambio de información. STATUSVZLA.com no autoriza pagos ni rescates privados.\n\n— Equipo STATUSVZLA.com`,
      });

      // Create in-app notification
      await base44.asServiceRole.entities.NotificacionesUsuario.create({
        user_id: sub.user_id,
        tipo: tipo_evento,
        titulo: asunto,
        mensaje: cuerpo,
        leida: false,
        ref_id: persona_id,
        link_ref: `/buscar-persona`,
      });

      notificados++;
    }

    return Response.json({ ok: true, notificados });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
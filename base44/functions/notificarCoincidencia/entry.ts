import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Mapeo de plantillas de email (español e inglés)
const TEMPLATES = {
  nueva_coincidencia_persona: {
    es: {
      subject: '🚨 Posible coincidencia encontrada para tu búsqueda',
      body: (nombre, enlace) => `Hola,\n\nSe ha reportado a una persona que podría coincidir con tu búsqueda de "${nombre}".\n\nPor favor, revisa la información en el siguiente enlace y confirma si se trata de la misma persona:\n${enlace}\n\nGracias por usar Status Venezuela.`,
    },
    en: {
      subject: '🚨 Possible match found for your search',
      body: (nombre, enlace) => `Hello,\n\nA person has been reported who may match your search for "${nombre}".\n\nPlease review the information at the following link and confirm if it is the same person:\n${enlace}\n\nThank you for using Status Venezuela.`,
    },
  },
  actualizacion_suscripcion: {
    es: {
      subject: '🔔 Actualización sobre tu suscripción',
      body: (nombre, enlace, estado, notas) => `Hola,\n\nHay una nueva actualización sobre "${nombre}", a la cual estás suscrito.\n\nNuevo estado: ${estado}\nNotas: ${notas}\n\nVer más detalles en:\n${enlace}\n\nStatus Venezuela.`,
    },
    en: {
      subject: '🔔 Update on your subscription',
      body: (nombre, enlace, estado, notas) => `Hello,\n\nThere is a new update on "${nombre}", to which you are subscribed.\n\nNew status: ${estado}\nNotes: ${notas}\n\nSee more details at:\n${enlace}\n\nStatus Venezuela.`,
    },
  },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const serviceRoleClient = base44.asServiceRole;
  const { tipo_notificacion, entidad_id, datos, lang = 'es' } = await req.json();

  try {
    const plantilla = TEMPLATES[tipo_notificacion]?.[lang];
    if (!plantilla) {
      return new Response(JSON.stringify({ error: 'Notification type not found' }), { status: 400 });
    }

    const subs = await serviceRoleClient.entities.Suscripciones.filter({ persona_id: entidad_id, activa: true });

    if (subs.length === 0) {
      return new Response(JSON.stringify({ message: 'No active subscribers' }), { status: 200 });
    }

    const enlace = `https://status-venezuela-cris-v2.base44.com/persona?id=${entidad_id}`;
    const subject = plantilla.subject;
    const body = plantilla.body(datos.nombre, enlace, datos.estado, datos.notas);

    for (const sub of subs) {
      await serviceRoleClient.integrations.Core.SendEmail({
        to: sub.email_notificacion,
        subject: subject,
        body: body,
      });
    }

    return new Response(JSON.stringify({ success: true, sent_to: subs.length }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
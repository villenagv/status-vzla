import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Mapeo de plantillas de email (español e inglés)
const TEMPLATES = {
  nueva_coincidencia_persona: {
    es: {
      subject: '🔍 Posible coincidencia para tu búsqueda',
      body: (nombre, enlace, estado, notas) => `Hola,\n\nSe registró a una persona con un nombre similar a "${nombre}".\n\n${notas || ''}\n\nRevisa en el perfil e indica si crees que es la misma persona. Status Venezuela SOLO compartirá los datos de contacto de esta persona si ella acepta la conexión.\n\nVer más detalles en:\n${enlace}\n\nStatus Venezuela.`,
    },
    en: {
      subject: '🔍 Possible match for your search',
      body: (nombre, enlace, estado, notas) => `Hello,\n\nA person has been registered with a name similar to "${nombre}".\n\n${notas || ''}\n\nPlease check the profile and confirm if it is the same person. Status Venezuela will ONLY share this person's contact details if they accept the connection.\n\nSee more details at:\n${enlace}\n\nThank you for using Status Venezuela.`,
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

    const emails = new Set();

    // 1. Suscriptores anónimos (botón "Avísame" en fichas de persona/edificio)
    const seguimiento = await serviceRoleClient.entities.SuscriptoresSeguimiento.filter({
      reporte_id: entidad_id,
      activo: true,
    });
    for (const s of seguimiento) {
      const email = s.telefono_whatsapp?.trim();
      if (email && email.includes('@')) emails.add(email);
    }

    // 2. Suscriptores con cuenta
    const porCuenta = await serviceRoleClient.entities.Suscripciones.filter({ persona_id: entidad_id, activa: true });
    for (const s of porCuenta) {
      if (s.email_notificacion?.trim()) emails.add(s.email_notificacion.trim());
    }

    if (emails.size === 0) {
      return new Response(JSON.stringify({ message: 'No active subscribers' }), { status: 200 });
    }

    const enlace = `https://app.statusvzla.com/persona?id=${entidad_id}`;
    const subject = plantilla.subject;
    const body = plantilla.body(datos.nombre, enlace, datos.estado, datos.notas);

    let enviados = 0;
    for (const email of emails) {
      try {
        await serviceRoleClient.integrations.Core.SendEmail({
          to: email,
          subject: subject,
          body: body,
        });
        enviados++;
      } catch (e) {
        console.warn(`Error enviando a ${email}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, sent_to: enviados }), { status: 200 });

    return new Response(JSON.stringify({ success: true, sent_to: subs.length }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
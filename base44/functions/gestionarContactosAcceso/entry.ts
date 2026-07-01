import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * gestionarContactosAcceso
 *
 * GET  → Obtiene los contactos de acceso de un edificio validando el token privado.
 * POST → Agrega un nuevo contacto de acceso validando el token.
 *
 * Query/Payload: { edificio_id, token, contacto? }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);

    // Leer params desde query string o body
    let edificio_id, token, contacto;

    if (req.method === 'GET') {
      edificio_id = url.searchParams.get('edificio_id');
      token = url.searchParams.get('token');
    } else {
      const body = await req.json().catch(() => ({}));
      edificio_id = body.edificio_id;
      token = body.token;
      contacto = body.contacto; // { nombre, telefono, email?, rol? }
    }

    if (!edificio_id || !token) {
      return Response.json({ error: 'edificio_id y token requeridos' }, { status: 400 });
    }

    // Obtener el reporte y validar token
    const rep = await base44.asServiceRole.entities.ReportesDano.get(edificio_id).catch(() => null);
    if (!rep) return Response.json({ error: 'Edificio no encontrado' }, { status: 404 });

    // Validar token
    if (rep.contactos_token !== token) {
      return Response.json({ error: 'Token inválido o expirado' }, { status: 403 });
    }

    if (req.method === 'GET') {
      return Response.json({
        ok: true,
        edificio: {
          id: rep.id,
          nombre_lugar: rep.nombre_lugar,
          direccion: rep.direccion,
          ciudad: rep.ciudad,
          estado_region: rep.estado_region,
        },
        contactos: rep.contactos_acceso || [],
      });
    }

    // POST: agregar contacto
    if (!contacto || !contacto.nombre || !contacto.telefono) {
      return Response.json({ error: 'nombre y telefono son requeridos' }, { status: 400 });
    }

    const contactosActuales = rep.contactos_acceso || [];
    const nuevoContacto = {
      nombre: String(contacto.nombre).trim(),
      telefono: String(contacto.telefono).trim(),
      email: contacto.email ? String(contacto.email).trim() : '',
      rol: contacto.rol ? String(contacto.rol).trim() : '',
      notas: contacto.notas ? String(contacto.notas).trim() : '',
      agregado_en: new Date().toISOString(),
    };

    const nuevosContactos = [...contactosActuales, nuevoContacto];

    await base44.asServiceRole.entities.ReportesDano.update(edificio_id, {
      contactos_acceso: nuevosContactos,
    });

    return Response.json({
      ok: true,
      total: nuevosContactos.length,
      contactos: nuevosContactos,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
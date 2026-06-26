import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function similitudNombre(a, b) {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const words = text => text.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const wa = words(na), wb = words(nb);
  if (wa.length === 0 || wb.length === 0) return 0;
  return wa.filter(w => wb.includes(w)).length / Math.max(wa.length, wb.length);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nombre, telefono, email, red_social, red_social_tipo, ciudad, estado_region, aceptar_conexion } = await req.json();

    if (!nombre) {
      return Response.json({ error: 'nombre es requerido' }, { status: 400 });
    }

    const matches = [];
    const buscadas = await base44.asServiceRole.entities.PersonasBuscadas.filter({ estado_caso: 'buscando' });
    const encontradas = await base44.asServiceRole.entities.PersonasEncontradas.list();

    // Buscar coincidencias de nombre en buscadas
    for (const p of buscadas) {
      const sim = similitudNombre(nombre, p.nombre_completo || '');
      if (sim > 0.6) {
        matches.push({
          tipo: 'buscada',
          nombre: p.nombre_completo,
          apodo: p.apodo || '',
          edad_aprox: p.edad_aprox || '',
          sexo: p.sexo || '',
          ultima_ubicacion_conocida: p.ultima_ubicacion_conocida || '',
          ciudad: p.ciudad || '',
          estado_region: p.estado_region || '',
          estado_caso: p.estado_caso || 'buscando',
          nivel_similitud: Math.round(sim * 100),
          id_origen: p.id,
        });
      }
    }

    // Buscar en encontradas (sin contacto, porque es info del reportante)
    for (const p of encontradas) {
      const sim = similitudNombre(nombre, p.nombre_o_descripcion || p.nombre_completo || '');
      if (sim > 0.6) {
        matches.push({
          tipo: 'encontrada',
          nombre: p.nombre_o_descripcion || p.nombre_completo || '',
          condicion: p.condicion || '',
          ubicacion_actual: p.ubicacion_actual || p.nombre_lugar || '',
          ciudad: p.ciudad || '',
          estado_region: p.estado_region || '',
          nivel_similitud: Math.round(sim * 100),
          id_origen: p.id,
        });
      }
    }

    matches.sort((a, b) => b.nivel_similitud - a.nivel_similitud);

    // Guardar el cruce en la base — estado_privacidad = reservado por defecto
    const cruce = await base44.asServiceRole.entities.CruceBusqueda.create({
      nombre_creador: nombre,
      telefono: telefono || '',
      email: email || '',
      red_social: red_social || '',
      red_social_tipo: red_social_tipo || '',
      ciudad: ciudad || '',
      estado_region: estado_region || '',
      persona_resultados: matches,
      resultado_mensaje: matches.length > 0
        ? `Encontramos ${matches.length} posible${matches.length > 1 ? 's' : ''} coincidencia${matches.length > 1 ? 's' : ''} en la base de búsqueda.`
        : 'No encontramos coincidencias directas. Tu registro quedó guardado para futuros cruces.',
      fondo: 'ciudadano',
      estado_privacidad: aceptar_conexion === true ? 'conexion_solicitada' : 'reservado',
    });

    // Notificar a buscadores — SOLO nombre y nivel de coincidencia, NO datos de contacto
    if (matches.length > 0 && matches[0].nivel_similitud > 75) {
      await base44.asServiceRole.functions.invoke('notificarCoincidencia', {
        tipo_notificacion: 'nueva_coincidencia_persona',
        entidad_id: matches[0].id_origen,
        datos: {
          nombre: nombre,
          estado: 'Posible coincidencia',
          notas: `Alguien se registró con un nombre que coincide con "${matches[0].nombre}" (${matches[0].nivel_similitud}% coincidencia). Para contactar a esta persona, solicita una conexión desde el perfil y esta deberá aceptarla para compartir su contacto.`,
          cruce_id: cruce.id,
          aceptar_conexion: true,
        },
      }).catch(() => {});
    }

    return Response.json({ ok: true, matches: matches.slice(0, 8) });
  } catch (error) {
    console.error('cruceBusqueda error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
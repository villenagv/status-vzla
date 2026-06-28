/**
 * normalizarCiudades — normaliza ciudades en ReportesDano sin usar IA ni créditos
 * Lógica pura: capitalización, trim, deduplicación exacta y corrección de variantes comunes.
 * Solo se puede llamar por un admin. No consume créditos de integración.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Mapa de variantes conocidas → nombre canónico
const CIUDAD_ALIASES = {
  'la guaira':       'La Guaira',
  'laguaira':        'La Guaira',
  'vargas':          'La Guaira',
  'caracas':         'Caracas',
  'ccs':             'Caracas',
  'maracaibo':       'Maracaibo',
  'valencia':        'Valencia',
  'barquisimeto':    'Barquisimeto',
  'maracay':         'Maracay',
  'barcelona':       'Barcelona',
  'puerto la cruz':  'Puerto La Cruz',
  'pto la cruz':     'Puerto La Cruz',
  'maturin':         'Maturín',
  'maturín':         'Maturín',
  'san cristobal':   'San Cristóbal',
  'san cristóbal':   'San Cristóbal',
  'merida':          'Mérida',
  'mérida':          'Mérida',
  'cumana':          'Cumaná',
  'cumaná':          'Cumaná',
  'ciudad bolivar':  'Ciudad Bolívar',
  'ciudad bolívar':  'Ciudad Bolívar',
  'ciudad guayana':  'Ciudad Guayana',
  'puerto ordaz':    'Ciudad Guayana',
  'san felix':       'Ciudad Guayana',
  'san félix':       'Ciudad Guayana',
  'pto. la cruz':    'Puerto La Cruz',
  'los teques':      'Los Teques',
  'guarenas':        'Guarenas',
  'guatire':         'Guatire',
  'petare':          'Petare',
  'catia la mar':    'Catia La Mar',
  'la vela':         'La Vela',
  'punto fijo':      'Punto Fijo',
  'coro':            'Coro',
  'acarigua':        'Acarigua',
  'araure':          'Araure',
};

function normalizeKey(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizar(ciudad) {
  if (!ciudad || !ciudad.trim()) return null;
  const key = normalizeKey(ciudad);
  if (CIUDAD_ALIASES[key]) return CIUDAD_ALIASES[key];
  // Capitalizar cada palabra si no hay alias
  return ciudad.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Traer todos los reportes (paginado de a 500)
    let skip = 0;
    const PAGE = 500;
    let totalFixed = 0;
    let totalSkipped = 0;
    const changes = [];

    while (true) {
      const batch = await base44.asServiceRole.entities.ReportesDano.list('-created_date', PAGE);
      if (!batch || batch.length === 0) break;

      const updates = [];
      for (const r of batch) {
        if (!r.ciudad) { totalSkipped++; continue; }
        const canonical = canonicalizar(r.ciudad);
        if (!canonical) { totalSkipped++; continue; }
        if (canonical !== r.ciudad) {
          updates.push({ id: r.id, ciudad: canonical });
          changes.push({ id: r.id, antes: r.ciudad, despues: canonical });
        } else {
          totalSkipped++;
        }
      }

      if (updates.length > 0) {
        await base44.asServiceRole.entities.ReportesDano.bulkUpdate(updates);
        totalFixed += updates.length;
      }

      // Si el batch es menor a PAGE, terminamos
      if (batch.length < PAGE) break;
      skip += PAGE;
    }

    // También normalizar PersonasBuscadas y PersonasEncontradas
    for (const entityName of ['PersonasBuscadas', 'PersonasEncontradas']) {
      const batch = await base44.asServiceRole.entities[entityName].list('-created_date', 500);
      const updates = [];
      for (const r of (batch || [])) {
        if (!r.ciudad) continue;
        const canonical = canonicalizar(r.ciudad);
        if (canonical && canonical !== r.ciudad) {
          updates.push({ id: r.id, ciudad: canonical });
          totalFixed++;
          changes.push({ id: r.id, entidad: entityName, antes: r.ciudad, despues: canonical });
        }
      }
      if (updates.length > 0) {
        await base44.asServiceRole.entities[entityName].bulkUpdate(updates);
      }
    }

    return Response.json({
      ok: true,
      total_normalizados: totalFixed,
      total_sin_cambios: totalSkipped,
      muestra_cambios: changes.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
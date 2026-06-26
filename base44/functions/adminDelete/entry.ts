import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_EMAIL = 'villenagv@gmail.com';
const ALLOWED_ENTITIES = [
  'PersonaCRIS', 'PersonasBuscadas', 'PersonasEncontradas',
  'ReportesDano', 'PuntosAyuda', 'Suscripciones',
  'SolicitudesInfoEdificio', 'CruceBusqueda', 'Coincidencia',
  'Necesidades', 'OfertasAyuda', 'InfraestructuraSos',
];

const ENTITY_NAME_TO_KEY = {
  PersonaCRIS: 'PersonaCRIS', PersonasBuscadas: 'PersonasBuscadas',
  PersonasEncontradas: 'PersonasEncontradas', ReportesDano: 'ReportesDano',
  PuntosAyuda: 'PuntosAyuda', Suscripciones: 'Suscripciones',
  SolicitudesInfoEdificio: 'SolicitudesInfoEdificio', CruceBusqueda: 'CruceBusqueda',
  Coincidencia: 'Coincidencia', Necesidades: 'Necesidades',
  OfertasAyuda: 'OfertasAyuda', InfraestructuraSos: 'InfraestructuraSos',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.email !== ALLOWED_EMAIL)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (user.email !== ALLOWED_EMAIL) {
      return new Response(JSON.stringify({ error: 'Only villenagv@gmail.com can manage data' }), { status: 403 });
    }

    const body = await req.json();
    const { action, entity_name, record_id, ids, query } = body;

    // Action: list entities
    if (action === 'list_entities') {
      return Response.json({ entities: ALLOWED_ENTITIES });
    }

    // Validate entity
    if (!entity_name || !ENTITY_NAME_TO_KEY[entity_name]) {
      return new Response(JSON.stringify({ error: 'Invalid entity' }), { status: 400 });
    }

    if (action === 'list_records') {
      const maxRecords = Math.min(body.limit || 30, 50);
      const records = await base44.asServiceRole.entities[entity_name].list('-created_date', maxRecords);
      return Response.json({ records });
    }

    if (action === 'filter_records') {
      const filterQuery = query || {};
      if (body.search_field && body.search_value) {
        filterQuery[body.search_field] = { $contains: body.search_value };
      }
      const maxRecords = Math.min(body.limit || 30, 50);
      const records = await base44.asServiceRole.entities[entity_name].filter(filterQuery, '-created_date', maxRecords);
      return Response.json({ records });
    }

    if (action === 'delete_single' && record_id) {
      await base44.asServiceRole.entities[entity_name].delete(record_id);
      return Response.json({ ok: true });
    }

    if (action === 'delete_many') {
      const idsList = ids || [];
      for (const id of idsList) {
        await base44.asServiceRole.entities[entity_name].delete(id).catch(() => {});
      }
      return Response.json({ ok: true, deleted: idsList.length });
    }

    if (action === 'delete_all_filtered' && query) {
      const deleted = await base44.asServiceRole.entities[entity_name].deleteMany(query);
      return Response.json({ ok: true, deleted: deleted.deleted_count || 0 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
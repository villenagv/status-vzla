import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_EMAIL = 'villenagv@gmail.com';
const ALLOWED_ENTITIES = [
  'ReportesDano', 'InfraestructuraSos', 'EstadoOperativoEdificio', 'PuntosAyuda',
  'PersonasBuscadas', 'PersonasEncontradas', 'PersonaRegistrada', 'PersonaCRIS',
  'RegistroInstitucional', 'ActualizacionesSitios', 'PistasPersonas',
  'SolicitudesInfoEdificio', 'CruceBusqueda', 'Coincidencia', 'Necesidades',
  'OfertasAyuda', 'Suscripciones', 'NotificacionesUsuario',
];

const PHOTO_FIELDS = [
  'foto_url', 'foto_url_2', 'foto_principal_url', 'foto_urls', 'foto_adicional_url',
  'fotos_adicionales_urls', 'archivo_url', 'file_url', 'video_url',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.email !== ALLOWED_EMAIL) return Response.json({ error: 'Only super admin can manage data' }, { status: 403 });

    const body = await req.json();
    const { action, entity_name, record_id, ids, data } = body;

    if (action === 'list_entities') {
      return Response.json({ entities: ALLOWED_ENTITIES });
    }

    if (!entity_name || !ALLOWED_ENTITIES.includes(entity_name)) {
      return Response.json({ error: 'Invalid entity' }, { status: 400 });
    }

    const entityApi = base44.asServiceRole.entities[entity_name];
    if (!entityApi) return Response.json({ error: 'Entity not available' }, { status: 400 });

    if (action === 'list_records') {
      const maxRecords = Math.min(Number(body.limit) || 50, 100);
      const records = await entityApi.list('-created_date', maxRecords);
      return Response.json({ records });
    }

    if (action === 'delete_single' && record_id) {
      await entityApi.delete(record_id);
      return Response.json({ ok: true, deleted: 1 });
    }

    if (action === 'delete_many') {
      const idsList = Array.isArray(ids) ? ids.filter(Boolean).slice(0, 100) : [];
      let deleted = 0;
      for (const id of idsList) {
        try {
          await entityApi.delete(id);
          deleted += 1;
        } catch (_error) {}
      }
      return Response.json({ ok: true, deleted });
    }

    if (action === 'update_record' && record_id && data && typeof data === 'object') {
      const cleanData = { ...data };
      delete cleanData.id;
      delete cleanData.created_date;
      delete cleanData.updated_date;
      delete cleanData.created_by;
      delete cleanData.created_by_id;
      await entityApi.update(record_id, cleanData);
      return Response.json({ ok: true, updated: record_id });
    }

    if (action === 'clear_photos' && record_id) {
      const record = await entityApi.get(record_id);
      const update = {};
      for (const field of PHOTO_FIELDS) {
        if (Array.isArray(record[field])) update[field] = [];
        else if (record[field]) update[field] = '';
      }
      if (Object.keys(update).length === 0) {
        return Response.json({ ok: true, cleared: 0 });
      }
      await entityApi.update(record_id, update);
      return Response.json({ ok: true, cleared: Object.keys(update).length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
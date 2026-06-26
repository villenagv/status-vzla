import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.email !== 'villenagv@gmail.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const serviceRoleClient = base44.asServiceRole;
    const MAX_COUNT = 2000; // Limit to avoid performance issues, this is an approximation

    const [
      personas,
      reportesDano,
      solicitudes,
      puntosAyuda,
      encontrados,
      alertas
    ] = await Promise.all([
      serviceRoleClient.entities.PersonaCRIS.list(null, MAX_COUNT),
      serviceRoleClient.entities.ReportesDano.list(null, MAX_COUNT),
      serviceRoleClient.entities.SolicitudesInfoEdificio.list(null, MAX_COUNT),
      serviceRoleClient.entities.PuntosAyuda.list(null, MAX_COUNT),
      serviceRoleClient.entities.PersonasEncontradas.list(null, MAX_COUNT),
      serviceRoleClient.entities.AlertaFamiliar.list(null, MAX_COUNT),
    ]);

    const stats = {
      personas: personas.length,
      reportesDano: reportesDano.length,
      solicitudes: solicitudes.length,
      puntosAyuda: puntosAyuda.length,
      encontrados: encontrados.length,
      alertas: alertas.length,
    };

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
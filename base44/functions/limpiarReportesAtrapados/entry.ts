import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ahora = Date.now();
    const LIMITE_CREACION = 24 * 60 * 60 * 1000; // 24 horas
    const LIMITE_ACTUALIZACION = 8 * 60 * 60 * 1000; // 8 horas

    // Obtener todos los reportes con personas atrapadas activas
    const reportes = await base44.asServiceRole.entities.ReportesDano.filter(
      { personas_atrapadas: { $in: ['si', 'voces', 'posible'] } },
      '-created_date',
      500
    );

    const aLimpiar = (reportes || []).filter(r => {
      const creado = new Date(r.created_date).getTime();
      const actualizado = new Date(r.updated_date || r.created_date).getTime();
      const pasadoDesdeCreacion = ahora - creado;
      const pasadoDesdeActualizacion = ahora - actualizado;
      return pasadoDesdeCreacion >= LIMITE_CREACION || pasadoDesdeActualizacion >= LIMITE_ACTUALIZACION;
    });

    const resultados = [];
    for (const r of aLimpiar) {
      await base44.asServiceRole.entities.ReportesDano.update(r.id, {
        personas_atrapadas: 'no_sabe',
      });
      resultados.push(r.id);
    }

    return Response.json({
      ok: true,
      limpiados: resultados.length,
      ids: resultados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
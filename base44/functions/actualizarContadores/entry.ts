import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [reportes, personasBuscadas, personasEncontradas, puntos] = await Promise.all([
      base44.entities.ReportesDano.list(null, 500),
      base44.entities.PersonasBuscadas.list(null, 500),
      base44.entities.PersonasEncontradas.list(null, 500),
      base44.entities.PuntosAyuda.list(null, 500),
    ]);

    const values = [
      { clave: 'edificios_reporte', valor: reportes.length },
      { clave: 'alertas_criticas', valor: reportes.filter(r => r.prioridad === 'critica').length },
      { clave: 'personas_atrapadas', valor: reportes.filter(r => r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces' || r.personas_atrapadas === 'posible').length },
      { clave: 'busquedas_activas', valor: personasBuscadas.filter(p => p.estado_caso === 'buscando').length },
      { clave: 'personas_encontradas', valor: personasEncontradas.length },
      { clave: 'puntos_ayuda', valor: puntos.filter(p => p.estado_operativo === 'abierto').length },
    ];

    const upserted = [];
    for (const v of values) {
      const existing = await base44.entities.ContadoresCache.filter({ clave: v.clave });
      if (existing.length > 0) {
        await base44.entities.ContadoresCache.update(existing[0].id, { valor: v.valor, ultima_actualizacion: new Date().toISOString() });
        upserted.push({ clave: v.clave, accion: 'actualizado', valor: v.valor });
      } else {
        const created = await base44.entities.ContadoresCache.create({ clave: v.clave, valor: v.valor, ultima_actualizacion: new Date().toISOString() });
        upserted.push({ clave: v.clave, accion: 'creado', valor: v.valor });
      }
    }

    return Response.json({ updated: upserted, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
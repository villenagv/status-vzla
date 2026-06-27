import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [reportes, personasBuscadas, personasEncontradas, personasRegistradas, puntos] = await Promise.all([
      base44.entities.ReportesDano.list('-created_date', 2000),
      base44.entities.PersonasBuscadas.list('-updated_date', 2000),
      base44.entities.PersonasEncontradas.list('-updated_date', 3000),
      base44.entities.PersonaRegistrada.list('-updated_date', 3000),
      base44.entities.PuntosAyuda.list('-updated_date', 2000),
    ]);

    const personasBuscando = personasBuscadas.filter(p => ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(p.estado_caso)).length;
    const personasEncontradasTotal = personasEncontradas.length + personasRegistradas.length;

    const values = [
      { clave: 'edificios_reporte', valor: reportes.length },
      { clave: 'alertas_criticas', valor: reportes.filter(r => r.prioridad === 'critica').length },
      { clave: 'personas_atrapadas', valor: reportes.filter(r => ['si', 'voces', 'posible'].includes(r.personas_atrapadas)).length },
      { clave: 'busquedas_activas', valor: personasBuscando + personasEncontradasTotal },
      { clave: 'personas_buscando', valor: personasBuscando },
      { clave: 'personas_registradas', valor: personasRegistradas.length },
      { clave: 'personas_encontradas', valor: personasEncontradasTotal },
      { clave: 'personas_encontradas_directas', valor: personasEncontradas.length },
      { clave: 'fallecidos_reportados', valor: personasBuscadas.filter(p => p.estado_caso === 'fallecido_reportado').length + personasEncontradas.filter(p => p.condicion === 'fallecido_reportado').length },
      { clave: 'puntos_ayuda', valor: puntos.filter(p => ['abierto', 'recibe_personas', 'recibe_heridos'].includes(p.estado_operativo)).length },
    ];

    const upserted = [];
    for (const v of values) {
      const existing = await base44.entities.ContadoresCache.filter({ clave: v.clave });
      if (existing.length > 0) {
        await base44.entities.ContadoresCache.update(existing[0].id, { valor: v.valor, ultima_actualizacion: new Date().toISOString() });
        upserted.push({ clave: v.clave, accion: 'actualizado', valor: v.valor });
      } else {
        await base44.entities.ContadoresCache.create({ clave: v.clave, valor: v.valor, ultima_actualizacion: new Date().toISOString() });
        upserted.push({ clave: v.clave, accion: 'creado', valor: v.valor });
      }
    }

    return Response.json({ updated: upserted, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
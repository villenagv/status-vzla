import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Función de actualización de contadores — alineada con lib/counters.js
// Puede ser llamada por admins o por automations del sistema.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [edificios, puntos, personasBuscadas, personasEncontradas, personasRegistradas] = await Promise.all([
      base44.asServiceRole.entities.ReportesDano.list('-updated_date', 2000),
      base44.asServiceRole.entities.PuntosAyuda.list('-updated_date', 500),
      base44.asServiceRole.entities.PersonasBuscadas.list('-updated_date', 2000),
      base44.asServiceRole.entities.PersonasEncontradas.list('-updated_date', 2000),
      base44.asServiceRole.entities.PersonaRegistrada.list('-updated_date', 2000),
    ]);

    const personasBuscando = personasBuscadas.filter(p =>
      ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(p.estado_caso)
    ).length;
    const personasEncontradasTotal = personasEncontradas.length + personasRegistradas.length;
    const fallecidos =
      personasBuscadas.filter(p => p.estado_caso === 'fallecido_reportado').length +
      personasEncontradas.filter(p => p.condicion === 'fallecido_reportado').length;

    const values = [
      // Edificios (fuente única: ReportesDano)
      { clave: 'total_edificios',           valor: edificios.length },
      { clave: 'edificios_reporte',         valor: edificios.length },  // alias legacy
      { clave: 'alertas_criticas',          valor: edificios.filter(r => r.prioridad === 'critica' || ['critico','colapsado'].includes(r.nivel_dano)).length },
      { clave: 'criticos',                  valor: edificios.filter(r => r.prioridad === 'critica' || ['critico','colapsado'].includes(r.nivel_dano)).length },
      { clave: 'graves',                    valor: edificios.filter(r => r.nivel_dano === 'grave').length },
      { clave: 'personas_atrapadas',        valor: edificios.filter(r => ['si','voces','posible'].includes(r.personas_atrapadas)).length },
      { clave: 'atrapados',                 valor: edificios.filter(r => ['si','voces','posible'].includes(r.personas_atrapadas)).length },
      // Personas
      { clave: 'busquedas_activas',         valor: personasBuscando + personasEncontradasTotal },
      { clave: 'busquedas_activas_total',   valor: personasBuscando + personasEncontradasTotal },
      { clave: 'personas_buscando',         valor: personasBuscando },
      { clave: 'personas_registradas',      valor: personasRegistradas.length },
      { clave: 'personas_encontradas',      valor: personasEncontradasTotal },
      { clave: 'personas_encontradas_directas', valor: personasEncontradas.length },
      { clave: 'fallecidos',                valor: fallecidos },
      { clave: 'fallecidos_reportados',     valor: fallecidos },
      // Puntos de ayuda
      { clave: 'puntos_ayuda',              valor: puntos.filter(p => ['abierto','recibe_personas','recibe_heridos'].includes(p.estado_operativo)).length },
      { clave: 'puntos_abiertos',           valor: puntos.filter(p => ['abierto','recibe_personas','recibe_heridos'].includes(p.estado_operativo)).length },
      { clave: 'puntos_saturados',          valor: puntos.filter(p => p.estado_operativo === 'saturado').length },
      { clave: 'total_puntos',              valor: puntos.length },
    ];

    const ts = new Date().toISOString();
    const upserted = [];

    for (const v of values) {
      const existing = await base44.asServiceRole.entities.ContadoresCache.filter({ clave: v.clave });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.ContadoresCache.update(existing[0].id, { valor: v.valor, ultima_actualizacion: ts });
        upserted.push({ clave: v.clave, accion: 'actualizado', valor: v.valor });
      } else {
        await base44.asServiceRole.entities.ContadoresCache.create({ clave: v.clave, valor: v.valor, ultima_actualizacion: ts });
        upserted.push({ clave: v.clave, accion: 'creado', valor: v.valor });
      }
    }

    return Response.json({ ok: true, updated: upserted, timestamp: ts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
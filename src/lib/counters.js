// Contadores con caché local — incluye personas registradas y encontradas en centros
import { base44 } from '@/api/base44Client';
import { getCached, setCached } from './cache';

export const COUNTERS_CACHE_KEY = 'contadores_globales_personas_v2';

export async function getContadores() {
  const cached = getCached(COUNTERS_CACHE_KEY);
  if (cached) return cached;

  const [reportes, puntos, personasBuscadas, personasEncontradas, personasRegistradas] = await Promise.all([
    base44.entities.InfraestructuraSos.list('-created_date', 2000).catch(() => []),
    base44.entities.PuntosAyuda.list('-updated_date', 2000).catch(() => []),
    base44.entities.PersonasBuscadas.list('-updated_date', 2000).catch(() => []),
    base44.entities.PersonasEncontradas.list('-updated_date', 3000).catch(() => []),
    base44.entities.PersonaRegistrada.list('-updated_date', 3000).catch(() => []),
  ]);

  const criticos = reportes.filter(r => r.prioridad === 'critica' || r.nivel_dano === 'critico').length;
  const atrapados = reportes.filter(r => ['si', 'voces', 'posible', 'familiares'].includes(r.personas_atrapadas)).length;
  const puntosAbiertos = puntos.filter(p => ['abierto', 'recibe_personas', 'recibe_heridos'].includes(p.estado_operativo)).length;
  const puntosSaturados = puntos.filter(p => p.estado_operativo === 'saturado').length;
  const personasBuscando = personasBuscadas.filter(p => ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(p.estado_caso)).length;
  const fallecidosBuscados = personasBuscadas.filter(p => p.estado_caso === 'fallecido_reportado').length;
  const fallecidosEncontrados = personasEncontradas.filter(p => p.condicion === 'fallecido_reportado').length;
  const personasEncontradasTotal = personasEncontradas.length + personasRegistradas.length;

  const result = {
    total_reportes: reportes.length,
    criticos,
    atrapados,
    total_puntos: puntos.length,
    puntos_abiertos: puntosAbiertos,
    puntos_saturados: puntosSaturados,
    personas_buscando: personasBuscando,
    personas_registradas: personasRegistradas.length,
    personas_encontradas_directas: personasEncontradas.length,
    personas_encontradas: personasEncontradasTotal,
    personas_fichas_total: personasBuscadas.length + personasEncontradas.length + personasRegistradas.length,
    busquedas_activas_total: personasBuscando + personasEncontradasTotal,
    fallecidos: fallecidosBuscados + fallecidosEncontrados,
  };

  setCached(COUNTERS_CACHE_KEY, result);
  return result;
}
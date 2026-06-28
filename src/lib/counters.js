// Contadores centralizados — FUENTE ÚNICA DE VERDAD para toda la plataforma CRIS
// Todos los componentes deben llamar a getContadores() en lugar de hacer fetching propio.
import { base44 } from '@/api/base44Client';
import { getCached, setCached } from './cache';

export const COUNTERS_CACHE_KEY = 'contadores_globales_v4';
// TTL del caché local: 2 minutos (evita recarga en cada navigate)
const CACHE_TTL_MS = 2 * 60 * 1000;

export async function getContadores() {
  const cached = getCached(COUNTERS_CACHE_KEY);
  if (cached) return cached;

  // Una sola fuente de datos por entidad — sin duplicados entre InfraestructuraSos y ReportesDano
  const [edificios, puntos, personasBuscadas, personasEncontradas, personasRegistradas] = await Promise.all([
    base44.entities.ReportesDano.list('-updated_date', 2000).catch(() => []),
    base44.entities.PuntosAyuda.list('-updated_date', 500).catch(() => []),
    base44.entities.PersonasBuscadas.list('-updated_date', 2000).catch(() => []),
    base44.entities.PersonasEncontradas.list('-updated_date', 2000).catch(() => []),
    base44.entities.PersonaRegistrada.list('-updated_date', 2000).catch(() => []),
  ]);

  // ── Edificios ──────────────────────────────────────────────────────────────
  const totalEdificios = edificios.length;
  const criticos = edificios.filter(r =>
    r.prioridad === 'critica' || ['critico', 'colapsado'].includes(r.nivel_dano)
  ).length;
  const graves = edificios.filter(r => r.nivel_dano === 'grave').length;
  const atrapados = edificios.filter(r =>
    ['si', 'voces', 'posible'].includes(r.personas_atrapadas)
  ).length;

  // ── Puntos de ayuda ────────────────────────────────────────────────────────
  const puntosAbiertos = puntos.filter(p =>
    ['abierto', 'recibe_personas', 'recibe_heridos'].includes(p.estado_operativo)
  ).length;
  const puntosSaturados = puntos.filter(p => p.estado_operativo === 'saturado').length;

  // ── Personas ───────────────────────────────────────────────────────────────
  const personasBuscando = personasBuscadas.filter(p =>
    ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(p.estado_caso)
  ).length;
  const fallecidos =
    personasBuscadas.filter(p => p.estado_caso === 'fallecido_reportado').length +
    personasEncontradas.filter(p => p.condicion === 'fallecido_reportado').length;
  const personasEncontradasTotal = personasEncontradas.length + personasRegistradas.length;
  const busquedasActivasTotal = personasBuscando + personasEncontradasTotal;

  const result = {
    // Edificios
    total_reportes: totalEdificios,       // alias canónico usado en ContadoresEntrada
    total_edificios: totalEdificios,
    criticos,
    graves,
    atrapados,
    // Personas
    personas_buscando: personasBuscando,
    personas_registradas: personasRegistradas.length,
    personas_encontradas_directas: personasEncontradas.length,
    personas_encontradas: personasEncontradasTotal,
    busquedas_activas_total: busquedasActivasTotal,
    fallecidos,
    // Puntos de ayuda
    total_puntos: puntos.length,
    puntos_abiertos: puntosAbiertos,
    puntos_saturados: puntosSaturados,
  };

  setCached(COUNTERS_CACHE_KEY, result, CACHE_TTL_MS);
  return result;
}
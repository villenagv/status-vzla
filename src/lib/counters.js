// Contadores con caché local de 6 horas — una sola consulta real por ventana
import { base44 } from '@/api/base44Client';
import { getCached, setCached } from './cache';

export async function getContadores() {
  const cached = getCached('contadores_globales');
  if (cached) return cached;

  const [reportes, puntos, personas] = await Promise.all([
    base44.entities.InfraestructuraSos.list(),
    base44.entities.PuntosAyuda.list(),
    base44.entities.PersonasBuscadas.list(),
  ]);

  const criticos = reportes.filter(r => r.prioridad === 'critica').length;
  const atrapados = reportes.filter(r => r.personas_atrapadas === 'si').length;
  const puntosAbiertos = puntos.filter(p => p.estado_operativo === 'abierto').length;
  const puntosSaturados = puntos.filter(p => p.estado_operativo === 'saturado').length;
  const personasBuscando = personas.filter(p => p.estado_caso === 'buscando').length;
  const personasEncontradas = personas.filter(p => p.estado_caso === 'encontrado_con_vida').length;
  const fallecidos = personas.filter(p => p.estado_caso === 'fallecido_reportado').length;

  const result = {
    total_reportes: reportes.length,
    criticos,
    atrapados,
    total_puntos: puntos.length,
    puntos_abiertos: puntosAbiertos,
    puntos_saturados: puntosSaturados,
    personas_buscando: personasBuscando,
    personas_encontradas: personasEncontradas,
    fallecidos,
  };

  setCached('contadores_globales', result);
  return result;
}
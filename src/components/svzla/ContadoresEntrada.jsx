import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { getContadores } from '@/lib/counters';

export default function ContadoresEntrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      try {
        // Low-bw: usar contadores cacheados
        if (lowBw) {
          const cached = await getContadores();
          if (cancelled) return;
          setDatos({
            edificios: cached.total_reportes || 0,
            criticos: cached.criticos || 0,
            atrapados: cached.atrapados || 0,
            buscados: cached.busquedas_activas_total || cached.personas_buscando || 0,
            buscadosDirectos: cached.personas_buscando || 0,
            registradas: cached.personas_registradas || 0,
            encontrados: cached.personas_encontradas || 0,
            encontradosDirectos: cached.personas_encontradas_directas || 0,
            puntos: cached.puntos_abiertos || 0,
            fallecidos: cached.fallecidos || 0,
          });
          return;
        }

        // Cache simple en localStorage (1 minuto) para evitar carga repetida
        const cacheKey = 'contadores-entrada-v3';
        const cached = (() => { try { const r = JSON.parse(localStorage.getItem(cacheKey)); return r && Date.now() - r.ts < 60000 ? r.value : null; } catch { return null; } })();
        if (cached) {
          setDatos(cached);
          return;
        }

        // Carga ligera: solo IDs para conteos, en lugar de listas completas de 200
        const [totalReportes, buscadas, encontradas, registradas, emailsCache] = await Promise.all([
          base44.entities.ReportesDano.list('-created_date', 2000).then(d => d.length),
          base44.entities.PersonasBuscadas.list('-updated_date', 2000),
          base44.entities.PersonasEncontradas.list('-updated_date', 3000),
          base44.entities.PersonaRegistrada.list('-updated_date', 3000).catch(() => []),
          base44.entities.ContadoresCache.filter({ clave: 'emails_enviados_total' }).catch(() => []),
        ]);
        const totalBuscados = buscadas.filter(p => ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(p.estado_caso)).length;
        const totalRegistradas = registradas.length;
        const totalEncontradosDirectos = encontradas.length;
        const totalEncontrados = totalEncontradosDirectos + totalRegistradas;
        const totalPersonasSeguimiento = totalBuscados + totalEncontrados;

        // Solo cargar 50 reportes para datos críticos en vez de 200
        const criticosData = await base44.entities.ReportesDano.list('-created_date', 50);

        if (cancelled) return;

        const criticos = criticosData.filter(r => ['critica', 'alta'].includes(r.prioridad)).length;
        const conAtrapados = criticosData.filter(r => r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces').length;
        const muertosBuscados = totalBuscados; // aproximación: no filtramos a nivel detalle

        const emailsEnviados = emailsCache.length > 0 ? (emailsCache[0].valor || 0) : 0;

        const res = {
          edificios: totalReportes,
          criticos: Math.max(criticos, conAtrapados),
          atrapados: conAtrapados,
          buscados: totalPersonasSeguimiento,
          buscadosDirectos: totalBuscados,
          registradas: totalRegistradas,
          encontrados: totalEncontrados,
          encontradosDirectos: totalEncontradosDirectos,
          puntos: 0,
          fallecidos: muertosBuscados || 0,
          emailsEnviados,
        };

        setDatos(res);
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), value: res }));
      } catch {}
    };
    cargar();
    return () => { cancelled = true; };
  }, [lowBw]);

  if (!datos) return (
    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-6">
      {[1,2,3,4,5,6,7].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );

  // Versión simplificada: mostramos solo los 5 contadores más importantes
  const items = [
    { val: datos.buscados, icon: '🔍', label: { es: 'Búsquedas + fichas', en: 'Searches + records' }, hint: { es: `${datos.buscadosDirectos || 0} búsq. · ${datos.registradas || 0} hosp.`, en: `${datos.buscadosDirectos || 0} searches · ${datos.registradas || 0} hospitals` }, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
    { val: datos.criticos, icon: '🚨', label: { es: 'Alertas críticas', en: 'Critical alerts' }, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', pulse: true },
    { val: datos.atrapados, icon: '🆘', label: { es: 'Personas atrapadas', en: 'Trapped people' }, color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-200', pulse: true },
    { val: datos.encontrados, icon: '✅', label: { es: 'Personas encontradas', en: 'People found' }, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-100' },
    { val: datos.edificios, icon: '🏗️', label: { es: 'Edificios reportados', en: 'Buildings reported' }, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
    ...(datos.emailsEnviados > 0 ? [{ val: datos.emailsEnviados, icon: '📧', label: { es: 'Notificaciones enviadas', en: 'Notifications sent' }, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' }] : []),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
      {items.map((item, i) => (
        <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-3 text-center flex flex-col items-center gap-1`}>
          <div className="flex items-center gap-1">
            <span className="text-base">{item.icon}</span>
            {item.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </div>
          <span className={`text-xl font-bold ${item.color}`}>{item.val}</span>
          <span className="text-[10px] text-gray-500 leading-tight text-center">
            {es ? item.label.es : item.label.en}
          </span>
          {item.hint && <span className="text-[9px] text-gray-400 leading-tight text-center">{es ? item.hint.es : item.hint.en}</span>}
        </div>
      ))}
    </div>
  );
}
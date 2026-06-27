import { useEffect, useState } from 'react';
import { AlertTriangle, Heart, Search, CheckCircle } from 'lucide-react';
import { COUNTERS_CACHE_KEY, getContadores } from '@/lib/counters';
import { getNextRefreshIn } from '@/lib/cache';
import { useLang } from '@/lib/LangContext';

export default function ContadoresBar() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [data, setData] = useState(null);
  const [next, setNext] = useState(null);

  useEffect(() => {
    getContadores().then(d => {
      setData(d);
      setNext(getNextRefreshIn(COUNTERS_CACHE_KEY));
    });
  }, []);

  if (!data) return (
    <div className="bg-[#111827] text-gray-500 text-[11px] text-center py-1.5 px-4">
      {es ? 'Cargando datos...' : 'Loading data...'}
    </div>
  );

  return (
    <div className="bg-[#111827] border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max text-xs">

          {data.criticos > 0 && (
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-[#B83A52]" />
              <strong className="text-[#F4D5DD]">{data.criticos}</strong>
              <span className="text-gray-500">{es ? 'críticos' : 'critical'}</span>
            </span>
          )}

          {data.atrapados > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B83A52] animate-pulse" />
              <strong className="text-[#F4D5DD]">{data.atrapados}</strong>
              <span className="text-gray-500">{es ? 'atrapados' : 'trapped'}</span>
            </span>
          )}

          <span className="text-gray-700">·</span>

          <span className="flex items-center gap-1.5">
            <Search size={11} className="text-[#D48C2E]" />
            <strong className="text-[#E6C195]">{data.busquedas_activas_total || data.personas_buscando}</strong>
            <span className="text-gray-500">{es ? 'búsquedas + fichas' : 'searches + records'}</span>
          </span>

          {data.personas_registradas > 0 && (
            <span className="flex items-center gap-1.5">
              <strong className="text-blue-300">{data.personas_registradas}</strong>
              <span className="text-gray-500">{es ? 'en hospitales' : 'in hospitals'}</span>
            </span>
          )}

          {data.personas_encontradas > 0 && (
            <span className="flex items-center gap-1.5">
              <CheckCircle size={11} className="text-green-400" />
              <strong className="text-green-300">{data.personas_encontradas}</strong>
              <span className="text-gray-500">{es ? 'encontradas incl. hospitales' : 'found incl. hospitals'}</span>
            </span>
          )}

          <span className="text-gray-700">·</span>

          {data.fallecidos > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <strong className="text-gray-400">{data.fallecidos}</strong>
              <span className="text-gray-500">{es ? 'fallecimientos reportados' : 'deaths reported'}</span>
            </span>
          )}

          <span className="text-gray-700">·</span>

          <span className="flex items-center gap-1.5">
            <Heart size={11} className="text-green-400" />
            <strong className="text-green-300">{data.puntos_abiertos}</strong>
            <span className="text-gray-500">{es ? 'puntos de ayuda' : 'help points'}</span>
          </span>

          {data.puntos_saturados > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D48C2E]" />
              <strong className="text-[#E6C195]">{data.puntos_saturados}</strong>
              <span className="text-gray-500">{es ? 'saturados' : 'saturated'}</span>
            </span>
          )}

          {next && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-[10px] text-gray-600">
                {es ? `Actualiza en ${next}` : `Updates in ${next}`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
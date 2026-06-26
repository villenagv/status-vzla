import { useEffect, useState } from 'react';
import { AlertTriangle, Users, MapPin, Heart } from 'lucide-react';
import { getContadores } from '@/lib/counters';
import { getNextRefreshIn } from '@/lib/cache';
import { useLang } from '@/lib/LangContext';

export default function ContadoresBar() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [next, setNext] = useState(null);

  useEffect(() => {
    getContadores().then(d => {
      setData(d);
      setNext(getNextRefreshIn('contadores_globales'));
    });
  }, []);

  if (!data) return (
    <div className="bg-[#111827] text-gray-400 text-xs text-center py-2 px-4">
      {t.counters_loading}
    </div>
  );

  return (
    <div className="bg-[#111827] text-white border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {data.criticos > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle size={12} className="text-[#B83A52]" />
              <strong className="text-[#F4D5DD]">{data.criticos}</strong>
              <span className="text-gray-400">{t.criticos}</span>
            </span>
          )}
          {data.atrapados > 0 && (
            <span className="flex items-center gap-1">
              <Users size={12} className="text-[#B83A52]" />
              <strong className="text-[#F4D5DD]">{data.atrapados}</strong>
              <span className="text-gray-400">{t.atrapados}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-[#D48C2E]" />
            <strong className="text-white">{data.total_reportes}</strong>
            <span className="text-gray-400">{t.reportes}</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart size={12} className="text-green-400" />
            <strong className="text-green-300">{data.puntos_abiertos}</strong>
            <span className="text-gray-400">{t.puntos_abiertos}</span>
          </span>
          {data.puntos_saturados > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D48C2E] inline-block" />
              <strong className="text-[#E6C195]">{data.puntos_saturados}</strong>
              <span className="text-gray-400">{t.saturados}</span>
            </span>
          )}
        </div>
        {next && (
          <span className="text-[10px] text-gray-600">{t.counters_next} {next}</span>
        )}
      </div>
    </div>
  );
}
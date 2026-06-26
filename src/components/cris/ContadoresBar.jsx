import { useEffect, useState } from 'react';
import { AlertTriangle, Users, MapPin, Heart } from 'lucide-react';
import { getContadores } from '@/lib/counters';
import { getNextRefreshIn } from '@/lib/cache';

export default function ContadoresBar() {
  const [data, setData] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(null);

  useEffect(() => {
    getContadores().then(d => {
      setData(d);
      setNextRefresh(getNextRefreshIn('contadores_globales'));
    });
  }, []);

  if (!data) return (
    <div className="bg-[#1A1F2E] text-white py-2 px-4 text-center text-sm animate-pulse">
      Cargando datos de emergencia...
    </div>
  );

  return (
    <div className="bg-[#1A1F2E] text-white">
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1">
            <AlertTriangle size={14} className="text-[#D48C2E]" />
            <span className="font-bold text-[#B83A52]">{data.criticos}</span>
            <span className="text-gray-300"> críticos</span>
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} className="text-[#B83A52]" />
            <span className="font-bold text-[#F4D5DD]">{data.atrapados}</span>
            <span className="text-gray-300"> atrapados</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-[#D48C2E]" />
            <span className="font-bold text-white">{data.total_reportes}</span>
            <span className="text-gray-300"> reportes</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart size={14} className="text-green-400" />
            <span className="font-bold text-green-300">{data.puntos_abiertos}</span>
            <span className="text-gray-300"> puntos abiertos</span>
          </span>
          {data.puntos_saturados > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D48C2E] inline-block" />
              <span className="font-bold text-[#E6C195]">{data.puntos_saturados}</span>
              <span className="text-gray-300"> saturados</span>
            </span>
          )}
        </div>
        {nextRefresh && (
          <span className="text-xs text-gray-500">Actualiza en {nextRefresh}</span>
        )}
      </div>
    </div>
  );
}
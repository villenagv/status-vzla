import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Buscador simple de edificios (por nombre o ciudad) para elegir a cuál
 * suscribirse cuando el usuario no está viendo una ficha específica.
 */
export default function BuscadorEdificioSuscripcion({ t, onSeleccionar }) {
  const [query, setQuery] = useState('');
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    base44.entities.ReportesDano.list('-updated_date', 300)
      .then(d => setEdificios(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const resultados = query.trim()
    ? edificios.filter(e => {
        const q = query.trim().toLowerCase();
        return (e.nombre_lugar || '').toLowerCase().includes(q) || (e.ciudad || '').toLowerCase().includes(q);
      }).slice(0, 20)
    : [];

  return (
    <>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('Nombre del edificio o ciudad...', 'Building name or city...', 'Nome do edifício ou cidade...')}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      {cargando && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-2">
          <Loader2 size={12} className="animate-spin" /> {t('Cargando edificios...', 'Loading buildings...', 'Carregando edifícios...')}
        </p>
      )}
      {!cargando && query.trim() && resultados.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">{t('Sin resultados.', 'No results.', 'Sem resultados.')}</p>
      )}
      <div className="space-y-1.5 mt-2">
        {resultados.map(e => (
          <button key={e.id} onClick={() => onSeleccionar({ id: e.id, nombre: e.nombre_lugar || e.tipo_estructura?.replace(/_/g, ' ') })}
            className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer">
            <p className="text-sm font-bold text-gray-800 truncate">{e.nombre_lugar || e.tipo_estructura?.replace(/_/g, ' ') || '—'}</p>
            <p className="text-[11px] text-gray-400 truncate">📍 {[e.direccion, e.ciudad].filter(Boolean).join(' · ')}</p>
          </button>
        ))}
      </div>
      {!query.trim() && !cargando && (
        <p className="text-xs text-gray-400 text-center py-4">
          {t('Escribe para buscar un edificio.', 'Type to search a building.', 'Digite para buscar um edifício.')}
        </p>
      )}
    </>
  );
}
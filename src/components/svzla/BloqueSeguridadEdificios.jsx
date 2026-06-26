import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import { base44 } from '@/api/base44Client';
import { getContadores } from '@/lib/counters';
import { nivelDanoOrder, esCritico } from '@/components/svzla/EstadoEdificioBadge';

const PAGE = 5;

export default function BloqueSeguridadEdificios() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrar, setMostrar] = useState(PAGE);
  const [vista, setVista] = useState('lista');
  const cacheKey = 'landing-edificios';

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      try {
        // Try cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < 120000) {
            setItems(parsed.data);
            setCargando(false);
            return;
          }
        }
        const todos = await base44.entities.ReportesDano.list('-created_date', 5);
        const sorted = todos.slice().sort((a, b) => {
          const aCrit = a.personas_atrapadas === 'si' ? 2 : a.personas_atrapadas === 'voces' ? 1 : 0;
          const bCrit = b.personas_atrapadas === 'si' ? 2 : b.personas_atrapadas === 'voces' ? 1 : 0;
          if (aCrit !== bCrit) return bCrit - aCrit;
          return nivelDanoOrder(b.nivel_dano) - nivelDanoOrder(a.nivel_dano);
        });
        if (!cancelled) {
          setItems(sorted);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: sorted }));
          } catch {}
        }
      } catch {}
      if (!cancelled) setCargando(false);
    };
    cargar();
    return () => { cancelled = true; };
  }, []);

  const visibles = items.slice(0, mostrar);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            🏗️ {es ? 'Reportes de edificios' : 'Building reports'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {es ? 'Ordenados por nivel de riesgo' : 'Sorted by risk level'}
          </p>
        </div>
        <Link to="/edificios" className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg font-semibold no-underline hover:bg-blue-100 transition-colors">
          {es ? 'Ver todos' : 'View all'}
        </Link>
      </div>

      {cargando && (
        <div className="px-4 py-6 text-center text-sm text-gray-400">
          {es ? 'Cargando...' : 'Loading...'}
        </div>
      )}

      {!cargando && visibles.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-gray-400 mb-2">{es ? 'Sin reportes de edificios' : 'No building reports yet'}</p>
        </div>
      )}

      {visibles.length > 0 && (
        <div className={`divide-y divide-gray-50 ${!cargando && visibles.length > 0 ? '' : ''}`}>
          {/* Tarjetas prioritarias */}
          {visibles.map((e, idx) => {
            const critical = esCritico(e.nivel_dano);
            return (
              <Link key={e.id} to={`/edificio?id=${e.id}`} className={`block px-4 py-3 hover:bg-gray-50 no-underline transition-colors ${critical ? 'bg-red-50 border-l-4 border-l-red-700' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.nombre_lugar || (es ? 'Sin nombre' : 'Unnamed')}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">📍 {e.direccion || ''}{e.direccion && e.ciudad ? ' · ' : ''}{e.ciudad || ''}{e.estado_region ? `, ${e.estado_region}` : ''}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-bold uppercase ${critical ? 'text-red-700' : 'text-gray-500'}`}>
                        {critical ? '🚫 ' : ''}{es ? 'Daño:' : 'Damage:'} {e.nivel_dano || 'no_evaluado'}
                      </span>
                      {e.personas_atrapadas === 'si' && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🆘 {es ? 'ATRAPADOS' : 'TRAPPED'}</span>
                      )}
                    </div>
                    {idx === 0 && critical && (
                      <div className="flex items-center gap-1.5 mt-1 bg-red-600 rounded-md px-2 py-1">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span className="text-[11px] font-black text-white uppercase tracking-wider">
                          🚫 {es ? 'NO ENTRAR' : 'DO NOT ENTER'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
        {items.length > mostrar ? (
          <button onClick={() => setMostrar(v => v + PAGE)}
            className="text-xs text-blue-700 font-semibold cursor-pointer hover:underline">
            {es ? `Ver ${Math.min(PAGE, items.length - mostrar)} más` : `Load ${Math.min(PAGE, items.length - mostrar)} more`}
          </button>
        ) : items.length > 0 ? (
          <span className="text-xs text-gray-400">{items.length} {es ? 'reporte(s)' : 'report(s)'}</span>
        ) : <span />}
        <Link to="/reportar-dano" className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-semibold no-underline hover:bg-gray-700">
          + {es ? 'Reportar edificio' : 'Report building'}
        </Link>
      </div>
    </div>
  );
}
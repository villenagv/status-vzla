import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';

const DANO_BADGE = {
  leve:       { es: 'Daño leve',       en: 'Minor damage',   cls: 'bg-yellow-100 text-yellow-800' },
  moderado:   { es: 'Daño moderado',   en: 'Moderate damage',cls: 'bg-orange-100 text-orange-700' },
  grave:      { es: 'DAÑO GRAVE',      en: 'SEVERE DAMAGE',  cls: 'bg-red-100 text-red-700' },
  critico:    { es: 'CRÍTICO',         en: 'CRITICAL',       cls: 'bg-red-200 text-red-800' },
  colapsado:  { es: 'COLABSADO',       en: 'COLLAPSED',      cls: 'bg-gray-700 text-white' },
  no_evaluado:{ es: 'Sin evaluar',     en: 'Not evaluated',  cls: 'bg-gray-100 text-gray-600' },
};

const PAGE = 5;

export default function DirectorioEdificiosEntrada() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrar, setMostrar] = useState(PAGE);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    base44.entities.ReportesDano.list('-created_date', 50)
      .then(d => setEdificios(d))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtradas = edificios.filter(e => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (e.nombre_lugar || '').toLowerCase().includes(q) ||
      (e.direccion || '').toLowerCase().includes(q) ||
      (e.ciudad || '').toLowerCase().includes(q) ||
      (e.estado_region || '').toLowerCase().includes(q)
    );
  });

  const visibles = filtradas.slice(0, mostrar);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <h2 className="text-sm font-bold text-gray-800">
            🏗️ {es ? 'Directorio de edificios' : 'Buildings directory'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {es ? 'Edificios reportados más recientes' : 'Most recent building reports'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/edificios"
            className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg font-semibold no-underline hover:bg-blue-100">
            {es ? 'Ver todos' : 'View all'}
          </Link>
        </div>
      </div>

      {/* Buscador */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setMostrar(PAGE); }}
          placeholder={es ? 'Buscar por nombre, dirección, ciudad...' : 'Search by name, address, city...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400 bg-gray-50"
        />
        <Link to="/edificios?modo=request"
          className="flex items-center gap-2 w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-semibold no-underline hover:bg-amber-100 transition-colors">
          <span className="text-sm">📋</span>
          <span>{es ? 'No encuentras un edificio? Solicita información' : "Can't find a building? Request info"}</span>
        </Link>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-50">
        {cargando && (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            {es ? 'Cargando...' : 'Loading...'}
          </div>
        )}
        {!cargando && visibles.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400 mb-2">
              {es ? 'Sin resultados.' : 'No results.'}
            </p>
            <Link to="/reportar-dano" className="text-sm text-blue-600 underline">
              {es ? '→ Reportar edificio dañado' : '→ Report damaged building'}
            </Link>
          </div>
        )}
        {visibles.map(e => {
          const st = DANO_BADGE[e.nivel_dano] || DANO_BADGE.no_evaluado;
          const esCritico = ['grave', 'critico', 'colapsado'].includes(e.nivel_dano);
          return (
            <Link key={e.id} to={`/edificio?id=${e.id}`} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 no-underline">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{e.nombre_lugar || (es ? 'Edificio sin nombre' : 'Unnamed building')}</p>
                <p className="text-xs text-gray-400 truncate">
                  📍 {e.direccion || ''}{e.direccion && e.ciudad ? ' · ' : ''}{e.ciudad || ''}{e.estado_region ? `, ${e.estado_region}` : ''}
                </p>
                {e.personas_atrapadas === 'si' && (
                  <span className="inline-block mt-0.5 text-[10px] font-bold bg-[#F4D5DD] text-[#B83A52] px-1.5 py-0.5 rounded-full">🆘 {es ? 'Atrapados' : 'Trapped'}</span>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls} ${esCritico ? 'animate-pulse' : ''}`}>
                {esCritico && '🚫'} {es ? st.es : st.en}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      {!cargando && (
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50 flex-wrap gap-2">
          {filtradas.length > mostrar ? (
            <button onClick={() => setMostrar(v => v + PAGE)}
              className="text-xs text-blue-700 font-semibold cursor-pointer hover:underline">
              {es ? `Ver ${Math.min(PAGE, filtradas.length - mostrar)} más` : `Load ${Math.min(PAGE, filtradas.length - mostrar)} more`}
            </button>
          ) : (
            <span className="text-xs text-gray-400">
              {filtradas.length} {es ? 'resultado(s)' : 'result(s)'}
            </span>
          )}
          <Link to="/reportar-dano"
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-semibold no-underline hover:bg-gray-700">
            + {es ? 'Reportar edificio' : 'Report building'}
          </Link>
        </div>
      )}
    </div>
  );
}
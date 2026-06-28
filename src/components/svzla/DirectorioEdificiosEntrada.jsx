import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';

const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', cardBorder: '#D4AC0D', label: { es: 'Daño leve',     en: 'Minor damage'   }, icon: '🟡' },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', cardBorder: '#E67E22', label: { es: 'Daño moderado', en: 'Moderate damage' }, icon: '🟠' },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', cardBorder: '#E74C3C', label: { es: 'Daño grave',    en: 'Severe damage'  }, icon: '🔴' },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', cardBorder: '#922B21', label: { es: 'CRÍTICO',       en: 'CRITICAL'       }, icon: '🚨' },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin evaluar',   en: 'Not evaluated'  }, icon: '⚪' },
  no_sabe:     { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin datos',     en: 'No data'        }, icon: '⚪' },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', cardBorder: '#4A0E0E', label: { es: 'COLAPSADO',     en: 'COLLAPSED'      }, icon: '💥' },
};

const PAGE = 8;

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d}d` : `${d}d ago`;
  if (h > 0) return es ? `hace ${h}h` : `${h}h ago`;
  if (m < 1) return es ? 'ahora' : 'now';
  return es ? `hace ${m}m` : `${m}m ago`;
}

export default function DirectorioEdificiosEntrada() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrar, setMostrar] = useState(PAGE);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    base44.entities.ReportesDano.list('-updated_date', 100)
      .then(d => setEdificios(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtradas = edificios.filter(e => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (e.nombre_lugar || '').toLowerCase().includes(q) ||
      (e.direccion || '').toLowerCase().includes(q) ||
      (e.ciudad || '').toLowerCase().includes(q)
    );
  });

  const visibles = filtradas.slice(0, mostrar);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <h2 className="text-sm font-bold text-gray-800">
            🏗️ {es ? 'Edificios reportados' : 'Reported buildings'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {es ? 'Más recientes primero' : 'Most recent first'}
          </p>
        </div>
        <Link to="/edificios"
          className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg font-semibold no-underline hover:bg-blue-100">
          {es ? 'Ver todos →' : 'View all →'}
        </Link>
      </div>

      {/* Buscador */}
      <div className="px-4 pt-3 pb-2">
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setMostrar(PAGE); }}
          placeholder={es ? 'Buscar por nombre, dirección, ciudad...' : 'Search by name, address, city...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400 bg-gray-50"
        />
      </div>

      {/* Estados */}
      {cargando && (
        <div className="px-4 py-6 text-center text-sm text-gray-400">
          {es ? 'Cargando...' : 'Loading...'}
        </div>
      )}
      {!cargando && visibles.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-gray-400 mb-2">{es ? 'Sin resultados.' : 'No results.'}</p>
          <Link to="/reportar-dano" className="text-sm text-blue-600 underline">
            {es ? '→ Reportar edificio dañado' : '→ Report damaged building'}
          </Link>
        </div>
      )}

      {/* Grid de tarjetas — igual que en /edificios */}
      {!cargando && visibles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3">
          {visibles.map(r => {
            const c = DANO_CONFIG[r.nivel_dano] || DANO_CONFIG.no_evaluado;
            const noEntrar = ['grave', 'critico', 'colapsado'].includes(r.nivel_dano);
            return (
              <Link key={r.id} to={`/edificio?id=${r.id}`}
                className="bg-white rounded-xl overflow-hidden no-underline hover:shadow-md transition-shadow flex flex-col"
                style={{ border: `2px solid ${noEntrar ? c.cardBorder : '#E5E7EB'}` }}>
                {/* Foto o placeholder */}
                {r.foto_urls?.length > 0 ? (
                  <div className="relative">
                    <img src={r.foto_urls[0]} alt="" className="w-full h-24 object-cover" loading="lazy" />
                    {r.foto_urls.length > 1 && (
                      <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                        +{r.foto_urls.length - 1}📷
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-24 flex flex-col items-center justify-center gap-1" style={{ background: c.bg }}>
                    <span className="text-2xl">{c.icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: c.color }}>
                      {es ? c.label.es : c.label.en}
                    </span>
                  </div>
                )}

                <div className="p-2.5 flex-1 flex flex-col gap-1">
                  {/* Badge NO ENTRAR */}
                  {noEntrar && (
                    <span className="self-start text-[8px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded">
                      🚫 {es ? 'NO ENTRAR' : 'DO NOT ENTER'}
                    </span>
                  )}

                  {/* Nombre */}
                  <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                    {r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || (es ? 'Sin nombre' : 'Unnamed')}
                  </p>

                  {/* Ubicación */}
                  <p className="text-[10px] text-gray-400 truncate">
                    📍 {[r.direccion, r.ciudad].filter(Boolean).join(' · ') || '—'}
                  </p>

                  {/* Badge nivel daño */}
                  <span className="self-start text-[9px] font-semibold px-1.5 py-0.5 rounded-full border mt-auto"
                    style={{ color: c.color, borderColor: c.border, background: c.bg }}>
                    {c.icon} {es ? c.label.es : c.label.en}
                  </span>

                  {/* Íconos de riesgo */}
                  {(r.riesgo_gas || r.riesgo_electrico || r.riesgo_incendio || r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces') && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {(r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces') && (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full font-bold">🆘</span>
                      )}
                      {r.riesgo_gas       && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded-full">💨</span>}
                      {r.riesgo_electrico && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-full">⚡</span>}
                      {r.riesgo_incendio  && <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full">🔥</span>}
                    </div>
                  )}

                  {/* Tiempo */}
                  <span className="text-[9px] text-gray-400 mt-0.5">
                    🕐 {tiempoRelativo(r.updated_date || r.created_date, es)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

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
              {filtradas.length} {es ? 'edificio(s)' : 'building(s)'}
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
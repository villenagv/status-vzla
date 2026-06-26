import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import BotonNotificarme from '@/components/svzla/BotonNotificarme';

const ESTADO_BADGE = {
  buscando:              { es: 'Buscando',          en: 'Searching',        cls: 'bg-yellow-100 text-yellow-800' },
  informacion_recibida:  { es: 'Info recibida',     en: 'Info received',    cls: 'bg-blue-100 text-blue-700' },
  visto_no_confirmado:   { es: 'Visto s/confirmar', en: 'Seen – unconf.',   cls: 'bg-orange-100 text-orange-700' },
  encontrado_con_vida:   { es: 'Encontrado ✅',     en: 'Found alive ✅',   cls: 'bg-green-100 text-green-800' },
  en_hospital_refugio:   { es: 'En hospital/refugio', en: 'Hospital/Shelter', cls: 'bg-teal-100 text-teal-800' },
  fallecido_reportado:   { es: 'Fallecido rep.',    en: 'Death reported',   cls: 'bg-gray-200 text-gray-700' },
};

const PAGE = 5;

export default function DirectorioPersonasEntrada() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrar, setMostrar] = useState(PAGE);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.PersonasBuscadas.list('-created_date', 50),
      base44.entities.PersonaRegistrada.list('-created_date', 50),
    ]).then(([buscadas, registradas]) => {
      // Normalizar PersonaRegistrada al mismo formato que PersonasBuscadas
      const regNorm = registradas
        .map(r => ({
          id: r.id,
          nombre_completo: r.nombre_completo,
          ciudad: r.ciudad,
          estado_region: r.estado_region,
          ultima_ubicacion_conocida: r.institucion_nombre || r.ciudad || '',
          edad_aprox: r.edad_aprox,
          estado_caso: r.condicion === 'a_salvo' ? 'encontrado_con_vida'
            : r.condicion === 'herido_grave' ? 'en_hospital_refugio'
            : r.condicion === 'herido_leve' ? 'en_hospital_refugio'
            : r.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
            : 'informacion_recibida',
          _fuente: 'institucional',
        }));
      const activas = buscadas.filter(p => p.estado_caso !== 'caso_cerrado');
      setPersonas([...activas, ...regNorm]);
    }).catch(() => {}).finally(() => setCargando(false));
  }, []);

  const filtradas = personas.filter(p => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (p.nombre_completo || '').toLowerCase().includes(q) ||
      (p.ciudad || '').toLowerCase().includes(q) ||
      (p.estado_region || '').toLowerCase().includes(q)
    );
  });

  const visibles = filtradas.slice(0, mostrar);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div>
          <h2 className="text-sm font-bold text-gray-800">
            👤 {es ? 'Directorio de personas' : 'People directory'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {es ? 'Búsquedas activas más recientes' : 'Most recent active searches'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/directorio-encontrados"
            className="text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg font-semibold no-underline hover:bg-green-100">
            {es ? 'Encontrados' : 'Found'}
          </Link>
          <Link to="/personas"
            className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg font-semibold no-underline hover:bg-blue-100">
            {es ? 'Ver todos' : 'View all'}
          </Link>
        </div>
      </div>

      {/* Buscador */}
      <div className="px-4 pt-3 pb-2">
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setMostrar(PAGE); }}
          placeholder={es ? 'Buscar por nombre, ciudad...' : 'Search by name, city...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400 bg-gray-50"
        />
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
            <Link to="/buscar-persona" className="text-sm text-blue-600 underline">
              {es ? '→ Registrar búsqueda' : '→ Register search'}
            </Link>
          </div>
        )}
        {visibles.map(p => {
          const st = ESTADO_BADGE[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso, cls: 'bg-gray-100 text-gray-600' };
          return (
            <div key={p.id} className="px-4 py-2.5 flex items-center gap-2">
              {p._fuente === 'institucional' ? (
                <div className="flex-1 min-w-0 rounded-lg py-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.nombre_completo}</p>
                      <p className="text-xs text-gray-400 truncate">
                        🏥 {es ? 'Registro institucional' : 'Institutional record'} · {p.ultima_ubicacion_conocida || p.ciudad}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>
                      {es ? st.es : st.en}
                    </span>
                  </div>
                </div>
              ) : (
              <Link to={`/persona?id=${p.id}`} className="flex-1 min-w-0 hover:bg-gray-50 rounded-lg py-1 no-underline">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.nombre_completo}</p>
                    <p className="text-xs text-gray-400 truncate">
                      📍 {p.ultima_ubicacion_conocida} · {p.ciudad}{p.estado_region ? `, ${p.estado_region}` : ''}
                      {p.edad_aprox ? ` · ${p.edad_aprox} ${es ? 'años' : 'yrs'}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>
                    {es ? st.es : st.en}
                  </span>
                </div>
              </Link>
              )}
              {p._fuente !== 'institucional' && <BotonNotificarme personaId={p.id} nombre={p.nombre_completo} className="flex-shrink-0" />}
            </div>
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
          <Link to="/buscar-persona"
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-semibold no-underline hover:bg-gray-700">
            + {es ? 'Reportar búsqueda' : 'Register search'}
          </Link>
        </div>
      )}
    </div>
  );
}
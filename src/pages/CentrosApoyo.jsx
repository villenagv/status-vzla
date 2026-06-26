import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Phone, MapPin, Clock, Search, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const PAGE_SIZE = 12;

const TIPO_CONFIG = {
  hospital:        { emoji: '🏥', es: 'Hospital público',    en: 'Public hospital',    color: 'bg-blue-100 text-blue-800' },
  clinica:         { emoji: '🏨', es: 'Clínica privada',     en: 'Private clinic',     color: 'bg-indigo-100 text-indigo-700' },
  refugio:         { emoji: '🏕️', es: 'Refugio',             en: 'Shelter',            color: 'bg-teal-100 text-teal-800' },
  centro_acopio:   { emoji: '📦', es: 'Centro de acopio',    en: 'Collection center',  color: 'bg-amber-100 text-amber-800' },
  bomberos:        { emoji: '🚒', es: 'Bomberos',             en: 'Firefighters',       color: 'bg-red-100 text-red-700' },
  proteccion_civil:{ emoji: '🛡️', es: 'Protección Civil',    en: 'Civil Protection',   color: 'bg-orange-100 text-orange-700' },
  iglesia:         { emoji: '⛪', es: 'Iglesia / Templo',     en: 'Church / Temple',    color: 'bg-purple-100 text-purple-700' },
  ong:             { emoji: '🤝', es: 'ONG / Humanitaria',   en: 'NGO / Humanitarian', color: 'bg-green-100 text-green-800' },
  comedor:         { emoji: '🍲', es: 'Comedor',              en: 'Food center',        color: 'bg-yellow-100 text-yellow-800' },
};

const ESTADO_CONFIG = {
  abierto:              { es: '✅ Abierto',               en: '✅ Open',              color: 'bg-green-100 text-green-800' },
  saturado:             { es: '⚠️ Saturado',              en: '⚠️ Saturated',        color: 'bg-orange-100 text-orange-700' },
  cerrado:              { es: '🔒 Cerrado',               en: '🔒 Closed',            color: 'bg-gray-200 text-gray-700' },
  necesita_suministros: { es: '📦 Necesita suministros', en: '📦 Needs supplies',    color: 'bg-blue-100 text-blue-700' },
  necesita_voluntarios: { es: '🙋 Necesita voluntarios', en: '🙋 Needs volunteers',  color: 'bg-purple-100 text-purple-700' },
  no_verificado:        { es: '❓ No verificado',         en: '❓ Not verified',      color: 'bg-gray-100 text-gray-500' },
};

const FILTROS = [
  { val: 'todo',          es: '🔍 Todo',            en: '🔍 All' },
  { val: 'emergencia',    es: '🚨 Emergencia',      en: '🚨 Emergency' },
  { val: 'hospital',      es: '🏥 Hospitales',      en: '🏥 Hospitals' },
  { val: 'refugio',       es: '🏕️ Refugios',        en: '🏕️ Shelters' },
  { val: 'acopio',        es: '📦 Acopio',          en: '📦 Supply' },
  { val: 'ong',           es: '🤝 ONGs',            en: '🤝 NGOs' },
];

const TIPO_A_FILTRO = {
  bomberos: 'emergencia', proteccion_civil: 'emergencia',
  hospital: 'hospital', clinica: 'hospital',
  refugio: 'refugio', escuela: 'refugio',
  centro_acopio: 'acopio', iglesia: 'acopio', comedor: 'acopio',
  ong: 'ong',
};

export default function CentrosApoyo() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [centros, setCentros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todo');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    base44.entities.PuntosAyuda.list('-updated_date', 200)
      .then(d => setCentros(d))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtrados = centros.filter(c => {
    const matchFiltro = filtro === 'todo' || (TIPO_A_FILTRO[c.tipo_lugar] === filtro) || c.tipo_entidad?.toLowerCase().includes(filtro);
    const q = query.toLowerCase();
    const matchQuery = !q ||
      (c.nombre_lugar || '').toLowerCase().includes(q) ||
      (c.ciudad || '').toLowerCase().includes(q) ||
      (c.estado_region || '').toLowerCase().includes(q) ||
      (c.tipo_entidad || '').toLowerCase().includes(q);
    return matchFiltro && matchQuery;
  });

  const visibles = filtrados.slice(0, page * PAGE_SIZE);
  const hayMas = filtrados.length > visibles.length;

  // Estadísticas rápidas
  const emergencia24h = centros.filter(c => ['bomberos','proteccion_civil'].includes(c.tipo_lugar)).length;
  const hospitales = centros.filter(c => ['hospital','clinica'].includes(c.tipo_lugar)).length;
  const acopios = centros.filter(c => ['centro_acopio','iglesia','comedor'].includes(c.tipo_lugar)).length;
  const ongs = centros.filter(c => c.tipo_lugar === 'ong').length;

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />

      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-xl font-black text-[#1A1F2E] mb-1">
          🏥 {es ? 'Centros de apoyo' : 'Help centers'}
        </h1>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Hospitales, refugios, acopios y ONGs activos. Verifica antes de trasladarte.'
            : 'Active hospitals, shelters, collection centers and NGOs. Verify before traveling.'}
        </p>

        {/* Aviso La Guaira */}
        <div className="flex gap-2 bg-[#FFF8EE] border border-[#E6C195] rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={14} className="text-[#D48C2E] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#7A5000] leading-relaxed">
            {es
              ? 'La Guaira: reportes de saturación hospitalaria. Coordina primero con Protección Civil o Bomberos antes de trasladarte.'
              : 'La Guaira: hospital saturation reports. Coordinate first with Civil Protection or firefighters before traveling.'}
          </p>
        </div>

        {/* Estadísticas rápidas */}
        {!cargando && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { n: emergencia24h, es: '24/7', en: '24/7', color: 'bg-red-50 border-red-200 text-red-700' },
              { n: hospitales,    es: 'Hospitales', en: 'Hospitals', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { n: acopios,       es: 'Acopios', en: 'Supply', color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { n: ongs,          es: 'ONGs', en: 'NGOs', color: 'bg-green-50 border-green-200 text-green-700' },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl border px-2 py-2 text-center ${s.color}`}>
                <p className="text-lg font-black">{s.n}</p>
                <p className="text-[10px] font-semibold">{es ? s.es : s.en}</p>
              </div>
            ))}
          </div>
        )}

        {/* Búsqueda */}
        <div className="flex gap-2 mb-3">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder={es ? 'Buscar por nombre, ciudad...' : 'Search by name, city...'}
            className="flex-1 border border-[#EDEBE8] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-sm text-gray-400 px-3">✕</button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {FILTROS.map(f => (
            <button key={f.val} onClick={() => { setFiltro(f.val); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                filtro === f.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600 hover:border-gray-400'
              }`}>
              {es ? f.es : f.en}
            </button>
          ))}
        </div>

        {cargando && (
          <div className="text-center py-10 text-sm text-gray-400">
            {es ? 'Cargando centros...' : 'Loading centers...'}
          </div>
        )}

        {!cargando && filtrados.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400">
            {es ? 'No se encontraron resultados.' : 'No results found.'}
          </div>
        )}

        {/* Lista */}
        <div className="flex flex-col gap-2.5">
          {visibles.map(c => {
            const tipoConf = TIPO_CONFIG[c.tipo_lugar] || { emoji: '📍', es: c.tipo_lugar, en: c.tipo_lugar, color: 'bg-gray-100 text-gray-600' };
            const estadoConf = ESTADO_CONFIG[c.estado_operativo] || ESTADO_CONFIG['no_verificado'];
            const necesitaActualizacion = c.requiere_actualizacion;

            return (
              <div key={c.id} className={`bg-white rounded-2xl border px-4 py-4 ${necesitaActualizacion ? 'border-[#E6C195]' : 'border-[#EDEBE8]'}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0 leading-none mt-0.5">{tipoConf.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-[#1A1F2E] leading-tight">{c.nombre_lugar}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tipoConf.color}`}>
                        {es ? tipoConf.es : tipoConf.en}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${estadoConf.color}`}>
                    {es ? estadoConf.es : estadoConf.en}
                  </span>
                </div>

                {/* Alerta actualización */}
                {necesitaActualizacion && (
                  <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-lg px-3 py-1.5 mb-2">
                    <p className="text-[11px] text-[#7A5000] font-semibold">
                      ⚠️ {es ? 'Verificar antes de trasladarse — puede estar saturado' : 'Verify before traveling — may be saturated'}
                    </p>
                  </div>
                )}

                {/* Ubicación */}
                {c.direccion && (
                  <p className="text-xs text-gray-500 flex items-start gap-1 mb-1">
                    <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                    <span>{c.direccion}</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mb-2">
                  {c.ciudad}{c.estado_region && c.ciudad !== c.estado_region ? `, ${c.estado_region}` : ''}
                </p>

                {/* Horario */}
                {c.nota_horario && !lowBw && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Clock size={10} /> {c.nota_horario}
                  </p>
                )}

                {/* Servicios */}
                {!lowBw && c.servicios_disponibles?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.servicios_disponibles.slice(0, 5).map(s => (
                      <span key={s} className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full">{s}</span>
                    ))}
                    {c.servicios_disponibles.length > 5 && (
                      <span className="text-[10px] text-gray-400">+{c.servicios_disponibles.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Necesidades urgentes */}
                {!lowBw && c.necesidades_urgentes?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.necesidades_urgentes.slice(0, 3).map(n => (
                      <span key={n} className="text-[10px] bg-[#FDF1F0] text-[#B83A52] border border-[#E8B4B0] px-1.5 py-0.5 rounded-full">
                        🆘 {n}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contacto */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {c.telefono_publico && (
                    <a href={`tel:${c.telefono_publico.split('/')[0].trim()}`}
                      className="flex items-center gap-1 text-xs font-semibold text-[#1A1F2E] bg-gray-50 border border-[#EDEBE8] px-2.5 py-1.5 rounded-lg hover:bg-gray-100">
                      <Phone size={11} /> {c.telefono_publico.split('/')[0].trim()}
                    </a>
                  )}
                  {c.whatsapp && (
                    <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-lg hover:bg-green-100">
                      💬 WhatsApp
                    </a>
                  )}
                  {c.sitio_web && !lowBw && (
                    <a href={c.sitio_web} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100">
                      🌐 Web
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ver más */}
        {hayMas && (
          <button onClick={() => setPage(p => p + 1)}
            className="w-full mt-4 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-[#EDEBE8] rounded-2xl bg-white hover:bg-gray-50">
            {es ? `Ver más (${filtrados.length - visibles.length} restantes)` : `Show more (${filtrados.length - visibles.length} remaining)`}
          </button>
        )}

        {/* CTA: Registrar nuevo */}
        <div className="mt-6 bg-[#F0F4FD] border border-[#B0C4E8] rounded-2xl px-4 py-4 text-center">
          <p className="text-sm font-bold text-[#1A1F2E] mb-1">
            {es ? '¿Conoces un centro que no aparece?' : 'Know a center not listed here?'}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {es ? 'Agrégalo para que otros puedan encontrarlo.' : 'Add it so others can find it.'}
          </p>
          <Link to="/institucional"
            className="inline-block bg-[#1A1F2E] text-white text-sm font-bold px-5 py-2.5 rounded-xl">
            {es ? '+ Registrar centro' : '+ Register center'}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
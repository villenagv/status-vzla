import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, MapPin, Share2, Plus, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import BotonNotificarme from '@/components/svzla/BotonNotificarme';

const PAGE_SIZE = 15;

const ESTADO_CONFIG = {
  buscando:             { es: '🔴 Sin contacto',          en: '🔴 Missing',              bg: 'bg-red-100 text-red-800 border-red-200' },
  informacion_recibida: { es: '🔵 Con pistas',             en: '🔵 Has leads',            bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  visto_no_confirmado:  { es: '🟠 Visto sin confirmar',    en: '🟠 Seen unconfirmed',     bg: 'bg-orange-100 text-orange-700 border-orange-200' },
  encontrado_con_vida:  { es: '✅ Localizado',             en: '✅ Located',              bg: 'bg-green-100 text-green-800 border-green-200' },
  en_hospital_refugio:  { es: '🏥 En hospital/refugio',    en: '🏥 In hospital/shelter',  bg: 'bg-teal-100 text-teal-800 border-teal-200' },
  fallecido_reportado:  { es: '⚫ Fallecido (reportado)',  en: '⚫ Deceased (reported)',   bg: 'bg-gray-200 text-gray-700 border-gray-300' },
  caso_cerrado:         { es: '🔒 Caso cerrado',           en: '🔒 Case closed',          bg: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const FILTROS = [
  { val: '',                    es: '🔍 Todos', en: '🔍 All' },
  { val: 'buscando',            es: '🔴 Sin contacto', en: '🔴 Missing' },
  { val: 'informacion_recibida',es: '🔵 Con pistas', en: '🔵 Has leads' },
  { val: 'encontrado_con_vida', es: '✅ Localizados', en: '✅ Located' },
];

const ZONAS = [
  'La Guaira', 'Vargas', 'Caracas', 'Yaracuy', 'Aragua', 'Carabobo',
];

export default function Personas() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [query, setQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    base44.entities.PersonasBuscadas.list('-updated_date', 300)
      .then(d => setTodos(d))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtrados = todos.filter(p => {
    const q = query.toLowerCase();
    const matchQ = !q ||
      (p.nombre_completo || '').toLowerCase().includes(q) ||
      (p.apodo || '').toLowerCase().includes(q) ||
      (p.ciudad || '').toLowerCase().includes(q) ||
      (p.ultima_ubicacion_conocida || '').toLowerCase().includes(q);
    const matchEstado = !filtroEstado || p.estado_caso === filtroEstado;
    const matchZona = !filtroZona ||
      (p.ciudad || '').toLowerCase().includes(filtroZona.toLowerCase()) ||
      (p.estado_region || '').toLowerCase().includes(filtroZona.toLowerCase()) ||
      (p.ultima_ubicacion_conocida || '').toLowerCase().includes(filtroZona.toLowerCase());
    return matchQ && matchEstado && matchZona;
  });

  const visibles = filtrados.slice(0, page * PAGE_SIZE);

  // Contadores
  const sinContacto = todos.filter(p => p.estado_caso === 'buscando').length;
  const conPistas = todos.filter(p => p.estado_caso === 'informacion_recibida' || p.estado_caso === 'visto_no_confirmado').length;
  const localizados = todos.filter(p => p.estado_caso === 'encontrado_con_vida' || p.estado_caso === 'en_hospital_refugio').length;

  const compartir = (p) => {
    const texto = es
      ? `🔴 BÚSQUEDA: ${p.nombre_completo} · ${p.edad_aprox ? p.edad_aprox + ' años · ' : ''}${p.ultima_ubicacion_conocida}, ${p.ciudad}. Comparte si lo/la reconoces. Ver más en el directorio.`
      : `🔴 SEARCHING: ${p.nombre_completo} · ${p.edad_aprox ? p.edad_aprox + ' yrs · ' : ''}${p.ultima_ubicacion_conocida}, ${p.ciudad}. Share if you recognize them. See the directory for details.`;
    if (navigator.share) {
      navigator.share({ title: `CRIS · ${p.nombre_completo}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      alert(es ? 'Texto copiado para compartir por WhatsApp' : 'Text copied to share on WhatsApp');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          👤 {es ? 'Personas desaparecidas' : 'Missing people'}
        </h1>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Directorio ciudadano de búsqueda y localización. Si reconoces a alguien, comparte su tarjeta.'
            : 'Citizen directory for search and location. If you recognize someone, share their card.'}
        </p>

        {/* Anti-extorsión */}
        <div className="flex gap-2 bg-[#2A1A20] border border-[#6B2D3E] rounded-xl px-3 py-2.5 mb-4">
          <span className="text-sm flex-shrink-0">⚠️</span>
          <p className="text-[11px] text-[#F4A4B8] font-semibold leading-relaxed">
            {es
              ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios anónimos.'
              : 'Never send money in exchange for information. This platform does not authorize payments, private rescue fees or anonymous intermediaries.'}
          </p>
        </div>

        {/* Contadores */}
        {!cargando && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-red-700">{sinContacto}</p>
              <p className="text-[10px] font-semibold text-red-600">{es ? 'Sin contacto' : 'Missing'}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-blue-700">{conPistas}</p>
              <p className="text-[10px] font-semibold text-blue-600">{es ? 'Con pistas' : 'Has leads'}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-green-700">{localizados}</p>
              <p className="text-[10px] font-semibold text-green-600">{es ? 'Localizados' : 'Located'}</p>
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={es ? 'Nombre, apodo, ciudad...' : 'Name, nickname, city...'}
              className="w-full border border-[#EDEBE8] rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            />
          </div>
        </div>

        {/* Filtro zona afectada */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          <button onClick={() => { setFiltroZona(''); setPage(1); }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${!filtroZona ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
            {es ? 'Toda VZ' : 'All VZ'}
          </button>
          {ZONAS.map(z => (
            <button key={z} onClick={() => { setFiltroZona(z); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${filtroZona === z ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
              {z}
            </button>
          ))}
        </div>

        {/* Filtro estado */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {FILTROS.map(f => (
            <button key={f.val} onClick={() => { setFiltroEstado(f.val); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${filtroEstado === f.val ? 'bg-[#B83A52] text-white border-[#B83A52]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
              {es ? f.es : f.en}
            </button>
          ))}
        </div>

        {cargando && <div className="text-center py-10 text-sm text-gray-400">{es ? 'Cargando...' : 'Loading...'}</div>}

        {!cargando && filtrados.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {es ? `${filtrados.length} persona(s)` : `${filtrados.length} person(s)`}
          </p>
        )}

        {!cargando && filtrados.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            <p className="mb-3">{es ? 'No hay resultados.' : 'No results.'}</p>
            <Link to="/buscar-persona" className="text-[#D48C2E] underline">
              {es ? '→ Registrar búsqueda' : '→ Register search'}
            </Link>
          </div>
        )}

        {/* Lista de personas */}
        <div className="space-y-2.5">
          {visibles.map(p => {
            const st = ESTADO_CONFIG[p.estado_caso] || ESTADO_CONFIG['buscando'];
            const esCritico = p.estado_caso === 'buscando';
            return (
              <div key={p.id}
                className={`bg-white rounded-2xl border-2 px-4 py-3 ${esCritico ? 'border-red-200' : 'border-[#EDEBE8]'}`}>
                <div className="flex gap-3 items-start">
                  {/* Foto */}
                  {!lowBw && p.foto_url ? (
                    <img src={p.foto_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-[#EDEBE8]" />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${esCritico ? 'bg-red-50' : 'bg-gray-50'}`}>
                      👤
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link to={`/persona?id=${p.id}`} className="font-black text-sm text-[#1A1F2E] leading-tight hover:underline no-underline">{p.nombre_completo}</Link>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.bg}`}>
                        {es ? st.es : st.en}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {p.edad_aprox && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{p.edad_aprox} {es ? 'años' : 'yrs'}</span>}
                      {p.sexo && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize">{p.sexo}</span>}
                    </div>

                    <p className="text-xs text-gray-500 flex items-start gap-1">
                      <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                      {p.ultima_ubicacion_conocida}{p.ciudad ? ` · ${p.ciudad}` : ''}
                    </p>

                    {!lowBw && p.descripcion_fisica && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.descripcion_fisica}</p>
                    )}

                    {p.fecha_ultima_vez && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {es ? 'Última vez:' : 'Last seen:'} {p.fecha_ultima_vez}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <BotonNotificarme personaId={p.id} nombre={p.nombre_completo} />
                  {p.contacto_telefono && (
                    <a href={`https://wa.me/${p.contacto_telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl">
                      💬 {es ? 'Contactar' : 'Contact'}
                    </a>
                  )}
                  <button onClick={() => compartir(p)}
                    className="flex items-center justify-center gap-1.5 bg-[#1A1F2E] text-white text-xs font-bold py-2.5 rounded-xl">
                    <Share2 size={12} />
                    {es ? 'Compartir' : 'Share'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Link to={`/reportar-encontrado`}
                    className="flex items-center justify-center gap-1 text-xs font-semibold text-[#D48C2E] bg-[#FFF8EE] border border-[#E6C195] py-2 rounded-xl">
                    ✋ {es ? 'La encontré' : 'I found them'}
                  </Link>
                  <Link to={`/pista?persona=${p.id}`}
                    className="flex items-center justify-center gap-1 text-xs font-semibold text-[#1A4A8A] bg-blue-50 border border-blue-200 py-2 rounded-xl">
                    <Eye size={11} /> {es ? 'Tengo info' : 'Have info'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filtrados.length > visibles.length && (
          <button onClick={() => setPage(p => p + 1)}
            className="w-full mt-4 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-[#EDEBE8] rounded-2xl bg-white hover:bg-gray-50">
            {es ? `Ver más (${filtrados.length - visibles.length} restantes)` : `Show more (${filtrados.length - visibles.length} remaining)`}
          </button>
        )}

        {/* CTAs */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          <Link to="/buscar-persona"
            className="flex items-center justify-center gap-2 bg-[#B83A52] text-white font-black py-4 rounded-2xl text-base">
            <Plus size={18} />
            {es ? 'Registrar persona desaparecida' : 'Register missing person'}
          </Link>
          <Link to="/reportar-encontrado"
            className="flex items-center justify-center gap-2 bg-[#D48C2E] text-white font-black py-4 rounded-2xl text-base">
            🙋 {es ? 'Reportar persona encontrada' : 'Report found person'}
          </Link>
          <Link to="/directorio-encontrados"
            className="flex items-center justify-center gap-2 bg-white border-2 border-[#1A1F2E] text-[#1A1F2E] font-bold py-3.5 rounded-2xl text-sm">
            📋 {es ? 'Ver directorio de encontrados' : 'View found people directory'}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
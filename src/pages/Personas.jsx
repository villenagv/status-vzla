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
    Promise.all([
      base44.entities.PersonasBuscadas.list('-updated_date', 300),
      base44.entities.PersonaRegistrada.list('-created_date', 300),
      base44.entities.PersonaCRIS.list('-created_date', 300),
      base44.entities.CruceBusqueda.list('-created_date', 300),
    ]).then(([buscadas, registradas, cris, cruces]) => {
      const buscadasNorm = buscadas.map(p => ({ ...p, _fuente: 'busqueda', _orden: p.updated_date || p.created_date }));
      const regNorm = registradas.map(r => ({
        id: `inst-${r.id}`,
        nombre_completo: r.nombre_completo,
        ciudad: r.ciudad,
        estado_region: r.estado_region,
        ultima_ubicacion_conocida: r.institucion_nombre || r.ciudad || '',
        edad_aprox: r.edad_aprox,
        sexo: r.sexo,
        foto_url: null,
        descripcion_fisica: r.observaciones || '',
        estado_caso: r.condicion === 'a_salvo' ? 'encontrado_con_vida'
          : r.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
          : (r.condicion === 'herido_grave' || r.condicion === 'herido_leve') ? 'en_hospital_refugio'
          : 'informacion_recibida',
        _fuente: 'institucional',
        _orden: r.created_date,
      }));
      const crisNorm = cris.map(r => ({
        id: `cris-${r.id}`,
        nombre_completo: [r.nombre, r.apellido].filter(Boolean).join(' ') || r.apodo || (es ? 'Persona registrada' : 'Registered person'),
        apodo: r.apodo,
        ciudad: r.ciudad,
        estado_region: r.estado_region,
        ultima_ubicacion_conocida: r.ubicacion_texto || r.ultima_ubicacion_conocida || r.centro_apoyo || '',
        edad_aprox: r.edad_aproximada,
        sexo: r.sexo,
        foto_url: r.foto_url,
        descripcion_fisica: r.notas_publicas || r.necesidades_inmediatas || '',
        estado_caso: ['a_salvo', 'estoy_aqui', 'encontrado'].includes(r.estado_actual) ? 'encontrado_con_vida'
          : ['herido', 'atencion_urgente', 'en_hospital', 'en_refugio'].includes(r.estado_actual) ? 'en_hospital_refugio'
          : 'informacion_recibida',
        _fuente: 'cris',
        _orden: r.updated_date || r.created_date,
      }));
      const cruceNorm = cruces.map(r => ({
        id: `cruce-${r.id}`,
        nombre_completo: r.nombre_creador || (es ? 'Persona registrada' : 'Registered person'),
        ciudad: r.ciudad,
        estado_region: r.estado_region,
        ultima_ubicacion_conocida: [r.ciudad, r.estado_region].filter(Boolean).join(', '),
        foto_url: null,
        descripcion_fisica: es ? 'Registro de búsqueda cruzada con contactos protegidos.' : 'Cross-search registration with protected contact details.',
        estado_caso: 'informacion_recibida',
        _fuente: 'cruce',
        _orden: r.created_date,
      }));
      setTodos([...buscadasNorm, ...regNorm, ...crisNorm, ...cruceNorm].sort((a, b) => new Date(b._orden || 0) - new Date(a._orden || 0)));
    }).catch(() => {}).finally(() => setCargando(false));
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

  const [compartidoId, setCompartidoId] = useState(null);
  const compartir = (p) => {
    const texto = es
      ? `🔴 BÚSQUEDA: ${p.nombre_completo} · ${p.edad_aprox ? p.edad_aprox + ' años · ' : ''}${p.ultima_ubicacion_conocida}, ${p.ciudad}. Comparte si lo/la reconoces. Ver más en el directorio.`
      : `🔴 SEARCHING: ${p.nombre_completo} · ${p.edad_aprox ? p.edad_aprox + ' yrs · ' : ''}${p.ultima_ubicacion_conocida}, ${p.ciudad}. Share if you recognize them. See the directory for details.`;
    if (navigator.share) {
      navigator.share({ title: `StatusVzla · ${p.nombre_completo}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      setCompartidoId(p.id);
      setTimeout(() => setCompartidoId(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-3xl mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          👤 {es ? 'Necesito ayuda con una persona' : 'I need help with a person'}
        </h1>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Busca, reporta o revisa listas institucionales. Elige la acción más cercana a tu situación.'
            : 'Search, report, or review institutional lists. Choose the action closest to your situation.'}
        </p>

        {/* Acciones principales — primero que todo */}
        <div className="grid grid-cols-1 gap-2 mb-5">
          <Link to="/buscar-persona"
            className="flex items-center justify-center gap-2 bg-[#B83A52] text-white font-black py-4 rounded-2xl text-base no-underline">
            <Plus size={18} />
            {es ? 'Registrar persona desaparecida' : 'Register missing person'}
          </Link>
          <div className="grid grid-cols-3 gap-2">
            <Link to="/reportar-encontrado"
              className="flex items-center justify-center gap-1 bg-[#D48C2E] text-white font-bold py-3.5 rounded-2xl text-xs no-underline text-center">
              🙋 {es ? 'Vi a alguien' : 'Saw someone'}
            </Link>
            <Link to="/directorio-encontrados"
              className="flex items-center justify-center gap-1 bg-white border-2 border-[#1A1F2E] text-[#1A1F2E] font-bold py-3.5 rounded-2xl text-xs no-underline text-center">
              📋 {es ? 'Encontrados' : 'Found list'}
            </Link>
            <Link to="/centros-apoyo"
              className="flex items-center justify-center gap-1 bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold py-3.5 rounded-2xl text-xs no-underline text-center">
              🏥 {es ? 'Refugios' : 'Shelters'}
            </Link>
          </div>
        </div>

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
          <div className="text-center py-8 space-y-2">
            <p className="text-3xl">👤</p>
            <p className="text-sm font-semibold text-gray-500">
              {es ? 'No hay resultados para esta búsqueda.' : 'No results for this search.'}
            </p>
            {(query || filtroEstado || filtroZona) && (
              <button onClick={() => { setQuery(''); setFiltroEstado(''); setFiltroZona(''); setPage(1); }}
                className="text-sm text-blue-600 underline cursor-pointer block mx-auto">
                {es ? '← Borrar filtros' : '← Clear filters'}
              </button>
            )}
            <Link to="/buscar-persona" className="inline-block mt-2 text-sm font-bold text-[#D48C2E] underline">
              {es ? '→ Registrar persona desaparecida' : '→ Register missing person'}
            </Link>
          </div>
        )}

        {/* Grilla de personas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      {p._fuente === 'busqueda' ? (
                        <Link to={`/persona?id=${p.id}`} className="font-black text-sm text-[#1A1F2E] leading-tight hover:underline no-underline">{p.nombre_completo}</Link>
                      ) : (
                        <span className="font-black text-sm text-[#1A1F2E] leading-tight">{p.nombre_completo}</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.bg}`}>
                        {es ? st.es : st.en}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {p._fuente === 'institucional' && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{es ? 'Registro institucional' : 'Institutional record'}</span>}
                      {p._fuente === 'cris' && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{es ? 'Se registró para ser encontrado' : 'Registered to be found'}</span>}
                      {p._fuente === 'cruce' && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">{es ? 'Búsqueda cruzada' : 'Cross search'}</span>}
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
                  {p._fuente === 'busqueda' ? (
                    <BotonNotificarme personaId={p.id} nombre={p.nombre_completo} />
                  ) : p._fuente === 'institucional' ? (
                    <Link to="/centros-apoyo" className="flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2.5 rounded-xl">
                      🏥 {es ? 'Ver centros' : 'View centers'}
                    </Link>
                  ) : (
                    <Link to="/busqueda-cruzada" className="flex items-center justify-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold py-2.5 rounded-xl">
                      🔗 {es ? 'Cruzar datos' : 'Cross-check'}
                    </Link>
                  )}
                  <button onClick={() => compartir(p)}
                    className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-colors ${compartidoId === p.id ? 'bg-green-600 text-white' : 'bg-[#1A1F2E] text-white'}`}>
                    <Share2 size={12} />
                    {compartidoId === p.id ? (es ? '✅ Copiado' : '✅ Copied') : (es ? 'Compartir' : 'Share')}
                  </button>
                </div>

                {p._fuente === 'busqueda' ? (
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
                ) : (
                  <p className="mt-2 text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    {p._fuente === 'institucional'
                      ? (es ? 'Ficha aportada por una institución. Contactos privados protegidos.' : 'Record submitted by an institution. Private contacts protected.')
                      : (es ? 'Registro visible para ayudar a encontrar coincidencias. Contactos privados protegidos.' : 'Visible record to help find matches. Private contacts protected.')}
                  </p>
                )}
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

        {/* CTA inferior repetido para fácil acceso tras recorrer la lista */}
        <div className="mt-6">
          <Link to="/buscar-persona"
            className="flex items-center justify-center gap-2 bg-[#B83A52] text-white font-black py-4 rounded-2xl text-base no-underline">
            <Plus size={18} />
            {es ? 'Registrar persona desaparecida' : 'Register missing person'}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
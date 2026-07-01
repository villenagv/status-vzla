import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, MapPin, Share2, Eye, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import BotonNotificarme from '@/components/svzla/BotonNotificarme';
import ActualizacionPersonaRapida from '@/components/svzla/ActualizacionPersonaRapida';

const PAGE_SIZE = 15;

// ── CONFIG DE ESTADOS — tráfico de luz ──────────────────────────────────────
const ESTADO_CONFIG = {
  buscando:             { es: '🔴 Sin contacto',        en: '🔴 Missing',          pt: '🔴 Sem contato',        bg: 'bg-red-100 text-red-800 border-red-200',   urgente: true },
  informacion_recibida: { es: '🔵 Con pistas',           en: '🔵 Has leads',        pt: '🔵 Com pistas',         bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  visto_no_confirmado:  { es: '🟠 Visto sin confirmar',  en: '🟠 Seen, unconfirmed',pt: '🟠 Visto sem confirmar',bg: 'bg-orange-100 text-orange-700 border-orange-200' },
  encontrado_con_vida:  { es: '✅ Localizado a salvo',   en: '✅ Located safe',     pt: '✅ Localizado a salvo', bg: 'bg-green-100 text-green-800 border-green-200' },
  en_hospital_refugio:  { es: '🏥 En refugio/hospital',  en: '🏥 In shelter',       pt: '🏥 Em abrigo',          bg: 'bg-teal-100 text-teal-800 border-teal-200' },
  fallecido_reportado:  { es: '⚫ Fallecido (reportado)', en: '⚫ Deceased (rep.)',  pt: '⚫ Falecido (rep.)',    bg: 'bg-gray-200 text-gray-700 border-gray-300' },
  caso_cerrado:         { es: '🔒 Caso cerrado',         en: '🔒 Closed',           pt: '🔒 Caso encerrado',     bg: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const FUENTE_BADGE = {
  busqueda:     { es: '🔴 Desaparecido',     en: '🔴 Missing',      pt: '🔴 Desaparecido',     cls: 'bg-red-50 text-red-700' },
  encontrada:   { es: '🙋 Encontrado/a',     en: '🙋 Found',        pt: '🙋 Encontrado/a',     cls: 'bg-green-50 text-green-700' },
  cris:         { es: '📍 Estoy aquí',       en: '📍 I am here',    pt: '📍 Estou aqui',       cls: 'bg-amber-50 text-amber-700' },
  institucional:{ es: '🏛️ Institucional',    en: '🏛️ Institutional',pt: '🏛️ Institucional',    cls: 'bg-blue-50 text-blue-700' },
  cruce:        { es: '🔗 Búsqueda cruzada', en: '🔗 Cross search', pt: '🔗 Busca cruzada',    cls: 'bg-purple-50 text-purple-700' },
};

const ESTADO_FILTROS = [
  { val: '',                    es: '🔍 Todos',       en: '🔍 All',     pt: '🔍 Todos' },
  { val: 'buscando',            es: '🔴 Sin contacto',en: '🔴 Missing', pt: '🔴 Sem contato' },
  { val: 'informacion_recibida',es: '🔵 Con pistas',  en: '🔵 Has leads',pt: '🔵 Com pistas' },
  { val: 'encontrado_con_vida', es: '✅ Localizados', en: '✅ Located', pt: '✅ Localizados' },
  { val: 'en_hospital_refugio', es: '🏥 En refugio',  en: '🏥 In shelter',pt: '🏥 Em abrigo' },
];

const FUENTE_FILTROS = [
  { val: '',             es: '📋 Todas',         en: '📋 All',          pt: '📋 Todas' },
  { val: 'busqueda',     es: '🔴 Desaparecidos', en: '🔴 Missing',      pt: '🔴 Desaparecidos' },
  { val: 'encontrada',   es: '🙋 Encontrados',   en: '🙋 Found',        pt: '🙋 Encontrados' },
  { val: 'cris',         es: '📍 Estoy aquí',    en: '📍 I am here',    pt: '📍 Estou aqui' },
  { val: 'institucional',es: '🏛️ Institucional', en: '🏛️ Institutional',pt: '🏛️ Institucional' },
];

const ZONAS = ['La Guaira', 'Vargas', 'Caracas', 'Yaracuy', 'Aragua', 'Carabobo'];

function normalizarPersonas(buscadas, registradas, cris, cruces, encontradas, es) {
  const buscadasN = buscadas.map(p => ({ ...p, _fuente: 'busqueda', _orden: p.updated_date || p.created_date }));
  const regN = registradas.map(r => ({
    id: `inst-${r.id}`, _rawId: r.id,
    nombre_completo: r.nombre_completo,
    ciudad: r.ciudad, estado_region: r.estado_region,
    ultima_ubicacion_conocida: r.institucion_nombre || r.ciudad || '',
    edad_aprox: r.edad_aprox, sexo: r.sexo, foto_url: null,
    descripcion_fisica: r.observaciones || '',
    estado_caso: r.condicion === 'a_salvo' ? 'encontrado_con_vida'
      : r.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
      : (r.condicion === 'herido_grave' || r.condicion === 'herido_leve') ? 'en_hospital_refugio'
      : 'informacion_recibida',
    _fuente: 'institucional', _orden: r.created_date,
  }));
  const crisN = cris.map(r => ({
    id: `cris-${r.id}`, _rawId: r.id,
    nombre_completo: [r.nombre, r.apellido].filter(Boolean).join(' ') || r.apodo || (es ? 'Persona registrada' : 'Registered person'),
    apodo: r.apodo, ciudad: r.ciudad, estado_region: r.estado_region,
    ultima_ubicacion_conocida: r.ubicacion_texto || r.ultima_ubicacion_conocida || r.centro_apoyo || '',
    edad_aprox: r.edad_aproximada, sexo: r.sexo, foto_url: r.foto_url,
    descripcion_fisica: r.notas_publicas || r.necesidades_inmediatas || '',
    estado_caso: ['a_salvo','estoy_aqui','encontrado'].includes(r.estado_actual) ? 'encontrado_con_vida'
      : ['herido','atencion_urgente','en_hospital','en_refugio'].includes(r.estado_actual) ? 'en_hospital_refugio'
      : 'informacion_recibida',
    _fuente: 'cris', _orden: r.updated_date || r.created_date,
  }));
  const crucesN = cruces.map(r => ({
    id: `cruce-${r.id}`, _rawId: r.id,
    nombre_completo: r.nombre_creador || (es ? 'Búsqueda registrada' : 'Registered search'),
    ciudad: r.ciudad, estado_region: r.estado_region,
    ultima_ubicacion_conocida: [r.ciudad, r.estado_region].filter(Boolean).join(', '),
    foto_url: null, descripcion_fisica: '',
    estado_caso: 'informacion_recibida',
    _fuente: 'cruce', _orden: r.created_date,
  }));
  const encontradasN = encontradas.map(r => ({
    id: `enc-${r.id}`, _rawId: r.id,
    nombre_completo: r.nombre_o_descripcion || (es ? 'Persona encontrada' : 'Found person'),
    ciudad: r.ciudad, estado_region: r.estado_region,
    ultima_ubicacion_conocida: r.nombre_lugar || r.ubicacion_actual || r.ciudad || '',
    edad_aprox: r.edad_aprox, sexo: r.sexo, foto_url: r.foto_url,
    descripcion_fisica: r.descripcion_fisica || r.notas_publicas || '',
    condicion: r.condicion,
    estado_caso: r.condicion === 'a_salvo' ? 'encontrado_con_vida'
      : r.condicion === 'herido_grave' ? 'en_hospital_refugio'
      : r.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
      : 'informacion_recibida',
    _fuente: 'encontrada', _orden: r.created_date,
  }));
  return [...buscadasN, ...regN, ...crisN, ...crucesN, ...encontradasN]
    .sort((a, b) => new Date(b._orden || 0) - new Date(a._orden || 0));
}

export default function Personas() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  const [tab, setTab] = useState('buscar'); // 'buscar' | 'reportar_buscado' | 'reportar_encontrado'
  const [todasPersonas, setTodasPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [query, setQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroFuente, setFiltroFuente] = useState('');
  const [page, setPage] = useState(1);

  const [compartidoId, setCompartidoId] = useState(null);
  const [personaActualizar, setPersonaActualizar] = useState(null);
  const [personaEncontrar, setPersonaEncontrar] = useState(null);
  const [encontradoForm, setEncontradoForm] = useState({ condicion: '', lugar: '', notas: '', nombre: '', telefono: '', email: '' });
  const [enviandoEncontrado, setEnviandoEncontrado] = useState(false);
  const [enviandoEncontradoOk, setEnviandoEncontradoOk] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.PersonasBuscadas.list('-updated_date', 300),
      base44.entities.PersonaRegistrada.list('-created_date', 300),
      base44.entities.PersonaCRIS.list('-created_date', 300),
      base44.entities.CruceBusqueda.list('-created_date', 300),
      base44.entities.PersonasEncontradas.list('-created_date', 300),
    ]).then(([buscadas, registradas, cris, cruces, encontradas]) => {
      setTodasPersonas(normalizarPersonas(buscadas, registradas, cris, cruces, encontradas, es));
    }).catch(() => {}).finally(() => setCargando(false));
  }, []);

  const personasFiltradas = todasPersonas.filter(p => {
    const q = query.toLowerCase();
    const matchQ = !q ||
      (p.nombre_completo || '').toLowerCase().includes(q) ||
      (p.apodo || '').toLowerCase().includes(q) ||
      (p.ciudad || '').toLowerCase().includes(q) ||
      (p.descripcion_fisica || '').toLowerCase().includes(q) ||
      (p.ultima_ubicacion_conocida || '').toLowerCase().includes(q);
    const matchEstado = !filtroEstado || p.estado_caso === filtroEstado;
    const matchZona = !filtroZona ||
      (p.ciudad || '').toLowerCase().includes(filtroZona.toLowerCase()) ||
      (p.estado_region || '').toLowerCase().includes(filtroZona.toLowerCase());
    const matchFuente = !filtroFuente || p._fuente === filtroFuente;
    return matchQ && matchEstado && matchZona && matchFuente;
  });

  const visibles = personasFiltradas.slice(0, page * PAGE_SIZE);

  // Contadores clave
  const urgentes = todasPersonas.filter(p => p.estado_caso === 'buscando').length;
  const localizados = todasPersonas.filter(p => ['encontrado_con_vida','en_hospital_refugio'].includes(p.estado_caso)).length;
  const conPistas = todasPersonas.filter(p => p.estado_caso === 'informacion_recibida').length;

  const compartir = (p) => {
    const texto = es
      ? `🔴 ¿La/lo has visto? ${p.nombre_completo} · Última vez en ${p.ultima_ubicacion_conocida || p.ciudad}. Comparte si la/lo reconoces.`
      : `🔴 Have you seen them? ${p.nombre_completo} · Last seen near ${p.ultima_ubicacion_conocida || p.ciudad}. Share if you recognize them.`;
    if (navigator.share) { navigator.share({ title: `Status Vzla · ${p.nombre_completo}`, text: texto }); }
    else { navigator.clipboard.writeText(texto); setCompartidoId(p.id); setTimeout(() => setCompartidoId(null), 2500); }
  };

  const abrirEncontrar = (p) => {
    setPersonaEncontrar(p);
    setEncontradoForm({ condicion: '', lugar: '', notas: '', nombre: '', telefono: '', email: '' });
    setEnviandoEncontrado(false); setEnviandoEncontradoOk(false);
  };

  const enviarEncontrado = async () => {
    if (!personaEncontrar || (!encontradoForm.condicion && !encontradoForm.lugar)) return;
    setEnviandoEncontrado(true);
    try {
      await base44.entities.PersonasEncontradas.create({
        nombre_o_descripcion: personaEncontrar.nombre_completo,
        condicion: encontradoForm.condicion || 'a_salvo',
        ubicacion_actual: encontradoForm.lugar,
        ciudad: personaEncontrar.ciudad || '',
        estado_region: personaEncontrar.estado_region || '',
        notas_publicas: encontradoForm.notas || undefined,
        persona_buscada_id: personaEncontrar._fuente === 'busqueda' ? personaEncontrar.id : undefined,
        reportado_por_nombre: encontradoForm.nombre || undefined,
        reportado_por_telefono: encontradoForm.telefono || undefined,
        reportado_por_email: encontradoForm.email || undefined,
        nivel_verificacion: 'comunidad', fuente: 'personas_page',
      });
      if (personaEncontrar._fuente === 'busqueda') {
        const nuevoEstado = encontradoForm.condicion === 'fallecido_reportado' ? 'fallecido_reportado' : 'informacion_recibida';
        await base44.entities.PersonasBuscadas.update(personaEncontrar.id, { estado_caso: nuevoEstado }).catch(() => {});
        setTodasPersonas(prev => prev.map(p => p.id === personaEncontrar.id ? { ...p, estado_caso: nuevoEstado } : p));
      }
      await base44.entities.EventoHistorial.create({
        persona_id: personaEncontrar.id,
        tipo_evento: 'persona_encontrada',
        descripcion: `${es ? 'Reportado encontrado/a en:' : 'Reported found at:'} ${encontradoForm.lugar}.${encontradoForm.notas ? ` ${encontradoForm.notas}` : ''}`,
        reportante_nombre: encontradoForm.nombre,
        reportante_contacto: encontradoForm.telefono || encontradoForm.email,
        fuente: 'personas_page',
      }).catch(() => {});
      await base44.functions.invoke('notificarActualizacion', {
        persona_id: personaEncontrar.id,
        descripcion: es ? `✅ Reporte de hallazgo: ${encontradoForm.lugar}` : `✅ Found report: ${encontradoForm.lugar}`,
        lang,
      }).catch(() => {});
      setEnviandoEncontradoOk(true);
    } catch {}
    setEnviandoEncontrado(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-3xl mx-auto w-full px-4 py-5">

        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-900">
          <ChevronLeft size={16} /> {t('Inicio', 'Home', 'Início')}
        </Link>

        {/* ── ENCABEZADO ── */}
        <div className="mb-4">
          <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
            🔍 {t('Búsqueda de personas', 'People search', 'Busca de pessoas')}
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            {t(
              'Busca en todos los registros: desaparecidos, encontrados, listas institucionales. Sin cuenta, sin costo.',
              'Search all records: missing, found, institutional lists. No account, no cost.',
              'Pesquise em todos os registros: desaparecidos, encontrados, listas institucionais. Sem conta, sem custo.'
            )}
          </p>
        </div>

        {/* ── ANTI-EXTORSIÓN ── */}
        <div className="flex gap-2 bg-[#2A1A20] border border-[#6B2D3E] rounded-xl px-3 py-2.5 mb-4">
          <span className="text-sm flex-shrink-0">⚠️</span>
          <p className="text-[11px] text-[#F4A4B8] font-semibold leading-relaxed">
            {t(
              'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios.',
              'Never send money for information. This platform does not authorize payments, private rescue fees or intermediaries.',
              'Nunca envie dinheiro por informações. Esta plataforma não autoriza pagamentos ou intermediários.'
            )}
          </p>
        </div>

        {/* ── ACCIONES PRINCIPALES ── */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Link to="/buscar-persona" className="flex flex-col items-center gap-1 bg-[#7C3AED] text-white font-black py-4 px-3 rounded-2xl text-sm no-underline text-center">
            <span className="text-xl">🔎</span>
            {t('Buscar a alguien', 'Search someone', 'Procurar alguém')}
            <span className="text-[10px] font-normal text-purple-200">{t('Reportar desaparecido', 'Report missing', 'Reportar desaparecido')}</span>
          </Link>
          <Link to="/reportar-encontrado" className="flex flex-col items-center gap-1 bg-[#15803D] text-white font-black py-4 px-3 rounded-2xl text-sm no-underline text-center">
            <span className="text-xl">🙋</span>
            {t('Encontré a alguien', 'I found someone', 'Encontrei alguém')}
            <span className="text-[10px] font-normal text-green-200">{t('Reportar hallazgo', 'Report finding', 'Reportar achado')}</span>
          </Link>
          <Link to="/estoy-aqui" className="flex flex-col items-center gap-1 bg-[#B45309] text-white font-bold py-3 px-3 rounded-2xl text-sm no-underline text-center">
            <span className="text-lg">📍</span>
            {t('Estoy aquí', 'I am here', 'Estou aqui')}
            <span className="text-[10px] font-normal text-amber-200">{t('Encuéntrame', 'Find me', 'Me encontre')}</span>
          </Link>
          <Link to="/busqueda-cruzada" className="flex flex-col items-center gap-1 bg-[#0E7490] text-white font-bold py-3 px-3 rounded-2xl text-sm no-underline text-center">
            <span className="text-lg">🔗</span>
            {t('Búsqueda cruzada', 'Cross search', 'Busca cruzada')}
            <span className="text-[10px] font-normal text-cyan-200">{t('Conectar info', 'Connect info', 'Conectar info')}</span>
          </Link>
        </div>

        {/* ── CONTADORES ── */}
        {!cargando && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-700">{urgentes}</p>
              <p className="text-[10px] font-bold text-red-600 uppercase">{t('Sin contacto', 'Missing', 'Sem contato')}</p>
              <p className="text-[9px] text-red-400">{t('Búsqueda activa', 'Active search', 'Busca ativa')}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-blue-700">{conPistas}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase">{t('Con pistas', 'Has leads', 'Com pistas')}</p>
              <p className="text-[9px] text-blue-400">{t('Info recibida', 'Info received', 'Info recebida')}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-700">{localizados}</p>
              <p className="text-[10px] font-bold text-green-600 uppercase">{t('Localizados', 'Located', 'Localizados')}</p>
              <p className="text-[9px] text-green-400">{t('A salvo / refugio', 'Safe / shelter', 'A salvo / abrigo')}</p>
            </div>
          </div>
        )}

        {/* ── BUSCADOR ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={t('Nombre, apodo, ciudad, descripción física...', 'Name, nickname, city, physical description...', 'Nome, apelido, cidade, descrição física...')}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 text-sm bg-gray-50 focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-colors" />
            {query && <button onClick={() => { setQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"><X size={14} /></button>}
          </div>

          {/* Filtro zona */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-semibold uppercase self-center mr-1">📍</span>
            {['', ...ZONAS].map(z => (
              <button key={z} onClick={() => { setFiltroZona(z); setPage(1); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${filtroZona === z ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {z || t('Toda VZ', 'All VZ', 'Toda VZ')}
              </button>
            ))}
          </div>

          {/* Filtro estado */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-semibold uppercase self-center mr-1">{t('Estado', 'Status', 'Estado')}:</span>
            {ESTADO_FILTROS.map(f => (
              <button key={f.val} onClick={() => { setFiltroEstado(f.val); setPage(1); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${filtroEstado === f.val ? 'bg-[#B83A52] text-white border-[#B83A52]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {t(f.es, f.en, f.pt)}
              </button>
            ))}
          </div>

          {/* Filtro fuente */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-semibold uppercase self-center mr-1">{t('Fuente', 'Source', 'Fonte')}:</span>
            {FUENTE_FILTROS.map(f => (
              <button key={f.val} onClick={() => { setFiltroFuente(f.val); setPage(1); }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${filtroFuente === f.val ? 'bg-[#6C3483] text-white border-[#6C3483]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {t(f.es, f.en, f.pt)}
              </button>
            ))}
          </div>

          {(query || filtroEstado || filtroZona || filtroFuente) && (
            <button onClick={() => { setQuery(''); setFiltroEstado(''); setFiltroZona(''); setFiltroFuente(''); setPage(1); }}
              className="text-xs text-blue-600 underline cursor-pointer">
              ← {t('Borrar todos los filtros', 'Clear all filters', 'Limpar todos os filtros')}
            </button>
          )}
        </div>

        {/* ── RESULTADOS ── */}
        {cargando ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            {t('Cargando registros...', 'Loading records...', 'Carregando registros...')}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {personasFiltradas.length} {t('persona(s) encontradas en', 'person(s) found in', 'pessoa(s) encontradas em')} {todasPersonas.length} {t('registros totales', 'total records', 'registros totais')}
            </p>

            {personasFiltradas.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-white rounded-2xl border border-gray-100 px-4">
                <p className="text-3xl">👤</p>
                <p className="text-sm font-semibold text-gray-500">{t('No hay resultados.', 'No results.', 'Sem resultados.')}</p>
                <p className="text-xs text-gray-400">{t('¿No encuentras a quien buscas? Registra la búsqueda.', "Can't find who you're looking for? Register the search.", 'Não encontra quem procura? Registre a busca.')}</p>
                <Link to="/buscar-persona" className="inline-block bg-[#B83A52] text-white text-sm font-bold px-5 py-2.5 rounded-xl no-underline">
                  + {t('Registrar búsqueda', 'Register search', 'Registrar busca')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {visibles.map(p => {
                  const st = ESTADO_CONFIG[p.estado_caso] || ESTADO_CONFIG['buscando'];
                  const badge = FUENTE_BADGE[p._fuente] || FUENTE_BADGE.cris;
                  const esUrgente = p.estado_caso === 'buscando';
                  return (
                    <div key={p.id}
                      className={`bg-white rounded-2xl border-2 px-4 py-3 ${esUrgente ? 'border-red-200' : 'border-gray-100'}`}>
                      {/* Alerta urgente */}
                      {esUrgente && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 mb-2">
                          <p className="text-[10px] font-black text-red-700">🚨 {t('BÚSQUEDA ACTIVA — Comparte si lo/la reconoces', 'ACTIVE SEARCH — Share if you recognize them', 'BUSCA ATIVA — Compartilhe se reconhecer')}</p>
                        </div>
                      )}

                      <div className="flex gap-3 items-start">
                        {/* Foto o avatar */}
                        {!lowBw && p.foto_url ? (
                          <img src={p.foto_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                        ) : (
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${esUrgente ? 'bg-red-50' : 'bg-gray-50'}`}>
                            {p._fuente === 'encontrada' ? '🙋' : p._fuente === 'cris' ? '📍' : '👤'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Nombre */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            {p._fuente === 'busqueda' ? (
                              <Link to={`/persona?id=${p.id}`}
                                className="font-black text-sm text-[#1A1F2E] leading-tight hover:underline no-underline">
                                {p.nombre_completo}
                              </Link>
                            ) : (
                              <span className="font-black text-sm text-[#1A1F2E] leading-tight">{p.nombre_completo}</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.bg}`}>
                              {t(st.es, st.en, st.pt || st.es)}
                            </span>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{t(badge.es, badge.en, badge.pt)}</span>
                            {p.edad_aprox && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{p.edad_aprox} {t('años', 'yrs', 'anos')}</span>}
                            {p.sexo && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize">{p.sexo}</span>}
                          </div>

                          {/* Ubicación */}
                          <p className="text-xs text-gray-500 flex items-start gap-1">
                            <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                            {[p.ultima_ubicacion_conocida, p.ciudad].filter(Boolean).join(' · ') || '—'}
                          </p>

                          {!lowBw && p.descripcion_fisica && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{p.descripcion_fisica}</p>
                          )}
                        </div>
                      </div>

                      {/* ── ACCIONES CONTEXTUALES ── */}
                      {p._fuente === 'busqueda' ? (
                        <div className="grid grid-cols-2 gap-1.5 mt-3">
                          <button onClick={() => abrirEncontrar(p)}
                            className="flex items-center justify-center gap-1 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                            ✋ {t('La encontré', 'I found them', 'Encontrei')}
                          </button>
                          <Link to={`/persona?id=${p.id}`}
                            className="flex items-center justify-center gap-1 bg-[#1A1F2E] text-white text-xs font-bold py-2.5 rounded-xl no-underline">
                            <Eye size={11} /> {t('Ver ficha', 'View record', 'Ver ficha')}
                          </Link>
                          <BotonNotificarme personaId={p.id} nombre={p.nombre_completo} />
                          <button onClick={() => compartir(p)}
                            className={`flex items-center justify-center gap-1 text-xs font-bold py-2.5 rounded-xl cursor-pointer ${compartidoId === p.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            <Share2 size={11} /> {compartidoId === p.id ? t('✅ Copiado', '✅ Copied', '✅ Copiado') : t('Compartir', 'Share', 'Compartilhar')}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 mt-3">
                          <button onClick={() => setPersonaActualizar(p)}
                            className="flex items-center justify-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                            ✍️ {t('Actualizar', 'Update', 'Atualizar')}
                          </button>
                          <button onClick={() => compartir(p)}
                            className={`flex items-center justify-center gap-1 text-xs font-bold py-2.5 rounded-xl cursor-pointer ${compartidoId === p.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            <Share2 size={11} /> {compartidoId === p.id ? t('✅ Copiado', '✅ Copied', '✅ Copiado') : t('Compartir', 'Share', 'Compartilhar')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {personasFiltradas.length > visibles.length && (
              <button onClick={() => setPage(p => p + 1)}
                className="w-full mt-4 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-gray-200 rounded-2xl bg-white hover:bg-gray-50 cursor-pointer">
                {t(`Ver más (${personasFiltradas.length - visibles.length} restantes)`, `Show more (${personasFiltradas.length - visibles.length} remaining)`, `Ver mais (${personasFiltradas.length - visibles.length} restantes)`)}
              </button>
            )}
          </>
        )}

        {/* ── CTA final ── */}
        <div className="mt-8 grid grid-cols-1 gap-3">
          <Link to="/buscar-persona" className="flex items-center justify-center gap-2 bg-[#B83A52] text-white font-black py-4 rounded-2xl text-sm no-underline">
            + {t('Registrar persona desaparecida', 'Register missing person', 'Registrar pessoa desaparecida')}
          </Link>
          <Link to="/reportar-encontrado" className="flex items-center justify-center gap-2 bg-[#15803D] text-white font-bold py-3 rounded-2xl text-sm no-underline">
            🙋 {t('Tengo info sobre una persona', 'I have info about a person', 'Tenho informações sobre uma pessoa')}
          </Link>
        </div>
      </div>

      {/* ── MODAL ACTUALIZAR ── */}
      {personaActualizar && (
        <ActualizacionPersonaRapida
          persona={personaActualizar} es={es}
          onClose={() => setPersonaActualizar(null)}
          onSaved={(actualizada) => setTodasPersonas(prev => prev.map(p => p.id === actualizada.id ? { ...p, ...actualizada } : p))}
        />
      )}

      {/* ── MODAL ENCONTRÉ A ALGUIEN ── */}
      {personaEncontrar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => !enviandoEncontradoOk && setPersonaEncontrar(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">✋ {t('Encontré a esta persona', 'I found this person', 'Encontrei esta pessoa')}</p>
                <h2 className="text-base font-black text-[#1A1F2E] leading-tight">{personaEncontrar.nombre_completo}</h2>
              </div>
              <button onClick={() => setPersonaEncontrar(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer">
                <X size={14} className="text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {enviandoEncontradoOk ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-4xl">✅</p>
                  <p className="font-black text-green-800 text-base">{t('¡Reporte enviado!', 'Report sent!', 'Relatório enviado!')}</p>
                  <p className="text-sm text-green-600">{t('Los familiares serán notificados por email si están suscritos.', "Family will be notified by email if subscribed.", 'A família será notificada por email se inscrita.')}</p>
                  <button onClick={() => setPersonaEncontrar(null)} className="text-sm font-bold text-gray-500 underline cursor-pointer">{t('Cerrar', 'Close', 'Fechar')}</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <span className="text-amber-600 flex-shrink-0">⚠️</span>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      {t('Solo comparte información verificada. No publiques rumores. Nunca envíes dinero.',
                         'Only share verified info. Do not spread rumors. Never send money.',
                         'Compartilhe apenas informações verificadas. Nunca envie dinheiro.')}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{t('¿Cómo está? *', 'Condition? *', 'Estado? *')}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 'a_salvo',            es: '✅ A salvo',          en: '✅ Safe',                pt: '✅ A salvo' },
                        { val: 'herido_leve',         es: '🩹 Herido leve',      en: '🩹 Mildly injured',     pt: '🩹 Ferido leve' },
                        { val: 'herido_grave',        es: '🚑 Herido grave',     en: '🚑 Seriously injured',  pt: '🚑 Ferido grave' },
                        { val: 'fallecido_reportado', es: '⚫ Fallecido (rep.)', en: '⚫ Deceased (rep.)',     pt: '⚫ Falecido (rep.)' },
                        { val: 'no_identificado',     es: '❓ No identificado',  en: '❓ Unidentified',        pt: '❓ Não identificado' },
                      ].map(c => (
                        <button key={c.val}
                          onClick={() => setEncontradoForm(f => ({ ...f, condicion: f.condicion === c.val ? '' : c.val }))}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer text-left transition-colors ${encontradoForm.condicion === c.val ? 'bg-green-700 text-white border-green-700' : 'bg-white border-gray-200 text-gray-700 hover:border-green-400'}`}>
                          {t(c.es, c.en, c.pt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{t('Lugar donde la/lo viste *', 'Where you saw them *', 'Onde você viu? *')}</p>
                    <input value={encontradoForm.lugar}
                      onChange={e => setEncontradoForm(f => ({ ...f, lugar: e.target.value }))}
                      placeholder={t('Refugio, hospital, dirección...', 'Shelter, hospital, address...', 'Abrigo, hospital, endereço...')}
                      className="w-full border border-green-300 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 bg-white" />
                  </div>

                  <textarea rows={2} value={encontradoForm.notas}
                    onChange={e => setEncontradoForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder={t('Información adicional (estado, acompañantes, necesidades...)', 'Additional info (condition, companions, needs...)', 'Informação adicional...')}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white" />

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500">🔒 {t('Tus datos — privados, no se publican', 'Your info — private, not published', 'Seus dados — privados')}</p>
                    <input value={encontradoForm.nombre} onChange={e => setEncontradoForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white placeholder-gray-400" />
                    <input value={encontradoForm.telefono} onChange={e => setEncontradoForm(f => ({ ...f, telefono: e.target.value }))}
                      placeholder={t('Teléfono / WhatsApp (opcional)', 'Phone / WhatsApp (optional)', 'Telefone / WhatsApp (opcional)')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white placeholder-gray-400" />
                  </div>

                  <button onClick={enviarEncontrado}
                    disabled={enviandoEncontrado || (!encontradoForm.condicion && !encontradoForm.lugar)}
                    className="w-full bg-green-700 text-white text-sm font-black py-4 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                    {enviandoEncontrado ? <Loader2 size={14} className="animate-spin" /> : '📡'}
                    {t('Enviar reporte de hallazgo', 'Send finding report', 'Enviar relatório de achado')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
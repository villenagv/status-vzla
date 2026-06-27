import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, MapPin, Share2, Plus, Eye, Loader2, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import BotonNotificarme from '@/components/svzla/BotonNotificarme';
import ActualizacionPersonaRapida from '@/components/svzla/ActualizacionPersonaRapida';

const PAGE_SIZE = 15;

const ESTADO_CONFIG = {
  buscando:             { es: '🔴 Sin contacto',          en: '🔴 Missing',              bg: 'bg-red-100 text-red-800 border-red-200' },
  informacion_recibida: { es: '🔵 Con pistas',             en: '🔵 Has leads',            bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  visto_no_confirmado:  { es: '🟠 Visto sin confirmar',    en: '🟠 Seen unconfirmed',     bg: 'bg-orange-100 text-orange-700 border-orange-200' },
  encontrado_con_vida:  { es: '✅ Localizado',             en: '✅ Located',              bg: 'bg-green-100 text-green-800 border-green-200' },
  en_hospital_refugio:  { es: '🏥 En refugio',             en: '🏥 In shelter',           bg: 'bg-teal-100 text-teal-800 border-teal-200' },
  fallecido_reportado:  { es: '⚫ Fallecido (rep.)',        en: '⚫ Deceased (rep.)',       bg: 'bg-gray-200 text-gray-700 border-gray-300' },
  caso_cerrado:         { es: '🔒 Cerrado',                en: '🔒 Closed',               bg: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const DANO_CONFIG = {
  leve:        { es: '🟡 Daño leve',    en: '🟡 Minor',    bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  moderado:    { es: '🟠 Moderado',     en: '🟠 Moderate', bg: 'bg-orange-100 text-orange-700 border-orange-200' },
  grave:       { es: '🔴 GRAVE',        en: '🔴 SEVERE',   bg: 'bg-red-100 text-red-800 border-red-200' },
  critico:     { es: '🔴 CRÍTICO',      en: '🔴 CRITICAL', bg: 'bg-red-200 text-red-900 border-red-400' },
  colapsado:   { es: '💥 COLAPSADO',    en: '💥 COLLAPSED',bg: 'bg-gray-800 text-white border-gray-700' },
  no_evaluado: { es: '⚪ Sin evaluar',  en: '⚪ Unevaluated',bg: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const ESTADO_FILTROS = [
  { val: '',                    es: '🔍 Todos', en: '🔍 All' },
  { val: 'buscando',            es: '🔴 Sin contacto', en: '🔴 Missing' },
  { val: 'informacion_recibida',es: '🔵 Con pistas', en: '🔵 Has leads' },
  { val: 'encontrado_con_vida', es: '✅ Localizados', en: '✅ Located' },
];

const ZONAS = ['La Guaira', 'Vargas', 'Caracas', 'Yaracuy', 'Aragua', 'Carabobo'];

// Normalizar todas las fuentes de personas a un formato único
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
    estado_caso: ['a_salvo', 'estoy_aqui', 'encontrado'].includes(r.estado_actual) ? 'encontrado_con_vida'
      : ['herido', 'atencion_urgente', 'en_hospital', 'en_refugio'].includes(r.estado_actual) ? 'en_hospital_refugio'
      : 'informacion_recibida',
    _fuente: 'cris', _orden: r.updated_date || r.created_date,
  }));

  const crucesN = cruces.map(r => ({
    id: `cruce-${r.id}`, _rawId: r.id,
    nombre_completo: r.nombre_creador || (es ? 'Persona registrada' : 'Registered person'),
    ciudad: r.ciudad, estado_region: r.estado_region,
    ultima_ubicacion_conocida: [r.ciudad, r.estado_region].filter(Boolean).join(', '),
    foto_url: null,
    descripcion_fisica: es ? 'Búsqueda cruzada con contactos protegidos.' : 'Cross-search with protected contacts.',
    estado_caso: 'informacion_recibida',
    _fuente: 'cruce', _orden: r.created_date,
  }));

  const encontradasN = encontradas.map(r => ({
    id: `enc-${r.id}`, _rawId: r.id,
    nombre_completo: r.nombre_o_descripcion || (es ? 'Persona encontrada' : 'Found person'),
    ciudad: r.ciudad, estado_region: r.estado_region,
    ultima_ubicacion_conocida: r.nombre_lugar || r.ubicacion_actual || r.ciudad || '',
    edad_aprox: r.edad_aprox, sexo: r.sexo,
    foto_url: r.foto_url,
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

// Normalizar edificios / infraestructura
function normalizarEdificios(reportesDano, infraSos) {
  const danoN = reportesDano.map(r => ({
    id: `dano-${r.id}`, _rawId: r.id,
    nombre: r.nombre_lugar || r.tipo_estructura || 'Edificio',
    tipo: r.tipo_estructura,
    nivel_dano: r.nivel_dano,
    estado_acceso: r.estado_acceso,
    personas_atrapadas: r.personas_atrapadas,
    direccion: r.direccion,
    ciudad: r.ciudad, estado_region: r.estado_region,
    riesgos: [r.riesgo_gas && 'gas', r.riesgo_electrico && 'elec', r.riesgo_incendio && 'fuego', r.riesgo_colapso && 'colapso'].filter(Boolean),
    _fuente: 'reporte_dano', _orden: r.created_date,
  }));

  const sosN = infraSos.map(r => ({
    id: `sos-${r.id}`, _rawId: r.id,
    nombre: r.tipo_reporte || 'Infraestructura',
    tipo: r.categoria || r.tipo_reporte,
    nivel_dano: r.nivel_dano,
    personas_atrapadas: r.personas_atrapadas,
    direccion: r.direccion,
    ciudad: r.ciudad, estado_region: r.estado_region,
    riesgos: [r.riesgo_gas && 'gas', r.riesgo_electrico && 'elec', r.riesgo_incendio && 'fuego'].filter(Boolean),
    prioridad: r.prioridad,
    _fuente: 'infraestructura', _orden: r.created_date,
  }));

  return [...danoN, ...sosN].sort((a, b) => {
    const orden = { critica: 0, alta: 1, normal: 2 };
    const pa = orden[a.prioridad] ?? (a.nivel_dano === 'critico' ? 0 : a.nivel_dano === 'grave' ? 1 : 2);
    const pb = orden[b.prioridad] ?? (b.nivel_dano === 'critico' ? 0 : b.nivel_dano === 'grave' ? 1 : 2);
    return pa - pb || new Date(b._orden || 0) - new Date(a._orden || 0);
  });
}

export default function Personas() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [tab, setTab] = useState('personas'); // 'personas' | 'edificios'
  const [todasPersonas, setTodasPersonas] = useState([]);
  const [todosEdificios, setTodosEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [query, setQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroFuente, setFiltroFuente] = useState('');
  const [page, setPage] = useState(1);

  const [compartidoId, setCompartidoId] = useState(null);
  const [personaActualizar, setPersonaActualizar] = useState(null);
  const [personaEncontrar, setPersonaEncontrar] = useState(null); // mini-modal encontré
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
      base44.entities.ReportesDano.list('-created_date', 200),
      base44.entities.InfraestructuraSos.list('-created_date', 200),
    ]).then(([buscadas, registradas, cris, cruces, encontradas, danos, sos]) => {
      setTodasPersonas(normalizarPersonas(buscadas, registradas, cris, cruces, encontradas, es));
      setTodosEdificios(normalizarEdificios(danos, sos));
    }).catch(() => {}).finally(() => setCargando(false));
  }, []);

  // ── Filtrado de personas ────────────────────────────────────────────────────
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
      (p.estado_region || '').toLowerCase().includes(filtroZona.toLowerCase()) ||
      (p.ultima_ubicacion_conocida || '').toLowerCase().includes(filtroZona.toLowerCase());
    const matchFuente = !filtroFuente || p._fuente === filtroFuente;
    return matchQ && matchEstado && matchZona && matchFuente;
  });

  // ── Filtrado de edificios ───────────────────────────────────────────────────
  const edificiosFiltrados = todosEdificios.filter(e => {
    const q = query.toLowerCase();
    const matchQ = !q ||
      (e.nombre || '').toLowerCase().includes(q) ||
      (e.tipo || '').toLowerCase().includes(q) ||
      (e.ciudad || '').toLowerCase().includes(q) ||
      (e.direccion || '').toLowerCase().includes(q);
    const matchZona = !filtroZona ||
      (e.ciudad || '').toLowerCase().includes(filtroZona.toLowerCase()) ||
      (e.estado_region || '').toLowerCase().includes(filtroZona.toLowerCase());
    return matchQ && matchZona;
  });

  const lista = tab === 'personas' ? personasFiltradas : edificiosFiltrados;
  const visibles = lista.slice(0, page * PAGE_SIZE);

  // Contadores personas
  const sinContacto = todasPersonas.filter(p => p.estado_caso === 'buscando').length;
  const localizados = todasPersonas.filter(p => ['encontrado_con_vida', 'en_hospital_refugio'].includes(p.estado_caso)).length;
  const encontradas = todasPersonas.filter(p => p._fuente === 'encontrada').length;

  // Contadores edificios
  const criticos = todosEdificios.filter(e => ['critico', 'grave', 'colapsado'].includes(e.nivel_dano)).length;
  const atrapados = todosEdificios.filter(e => e.personas_atrapadas === 'si').length;

  const compartir = (p) => {
    const texto = es
      ? `🔴 BÚSQUEDA: ${p.nombre_completo} · ${p.ultima_ubicacion_conocida}, ${p.ciudad}. Comparte si lo/la reconoces.`
      : `🔴 SEARCHING: ${p.nombre_completo} · ${p.ultima_ubicacion_conocida}, ${p.ciudad}. Share if you recognize them.`;
    if (navigator.share) {
      navigator.share({ title: `CRIS · ${p.nombre_completo}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      setCompartidoId(p.id);
      setTimeout(() => setCompartidoId(null), 2500);
    }
  };

  const aplicarActualizacionLocal = (actualizada) => {
    setTodasPersonas(prev => prev.map(p => p.id === actualizada.id ? { ...p, ...actualizada } : p));
  };

  const abrirEncontrar = (p) => {
    setPersonaEncontrar(p);
    setEncontradoForm({ condicion: '', lugar: '', notas: '', nombre: '', telefono: '', email: '' });
    setEnviandoEncontrado(false);
    setEnviandoEncontradoOk(false);
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
        nivel_verificacion: 'comunidad',
        fuente: 'personas_page',
      });
      if (personaEncontrar._fuente === 'busqueda') {
        await base44.entities.PersonasBuscadas.update(personaEncontrar.id, {
          estado_caso: encontradoForm.condicion === 'fallecido_reportado' ? 'fallecido_reportado' : 'informacion_recibida',
        }).catch(() => {});
        aplicarActualizacionLocal({ ...personaEncontrar, estado_caso: encontradoForm.condicion === 'fallecido_reportado' ? 'fallecido_reportado' : 'informacion_recibida' });
      }
      await base44.entities.EventoHistorial.create({
        persona_id: personaEncontrar.id,
        tipo_evento: 'persona_encontrada',
        descripcion: (es ? `Reportado encontrado/a en: ${encontradoForm.lugar}.` : `Reported found at: ${encontradoForm.lugar}.`) + (encontradoForm.notas ? ` ${encontradoForm.notas}` : ''),
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

  const FUENTE_FILTROS = [
    { val: '', es: '📋 Todas las fuentes', en: '📋 All sources' },
    { val: 'busqueda', es: '🔴 Desaparecidos', en: '🔴 Missing' },
    { val: 'encontrada', es: '🙋 Encontrados', en: '🙋 Found' },
    { val: 'cris', es: '📍 Estoy aquí', en: '📍 I am here' },
    { val: 'institucional', es: '🏛️ Institucional', en: '🏛️ Institutional' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-3xl mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          🔍 {es ? 'Directorio unificado' : 'Unified directory'}
        </h1>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Busca en todas las bases de datos: personas desaparecidas, encontradas, registradas, listados institucionales y edificios dañados.'
            : 'Search all databases: missing, found, registered people, institutional lists, and damaged buildings.'}
        </p>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Link to="/buscar-persona" className="flex items-center justify-center gap-2 bg-[#B83A52] text-white font-black py-4 rounded-2xl text-sm no-underline">
            <Plus size={16} /> {es ? 'Reportar desaparecido' : 'Report missing'}
          </Link>
          <Link to="/reportar-encontrado" className="flex items-center justify-center gap-2 bg-[#1A7A4A] text-white font-black py-4 rounded-2xl text-sm no-underline">
            🙋 {es ? 'Encontré a alguien' : 'I found someone'}
          </Link>
          <Link to="/estoy-aqui" className="flex items-center justify-center gap-2 bg-[#784212] text-white font-bold py-3 rounded-2xl text-sm no-underline">
            📍 {es ? 'Estoy aquí / Encuéntrame' : 'I am here / Find me'}
          </Link>
          <Link to="/reportar-dano" className="flex items-center justify-center gap-2 bg-[#C0392B] text-white font-bold py-3 rounded-2xl text-sm no-underline">
            🏗️ {es ? 'Reportar edificio' : 'Report building'}
          </Link>
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

        {/* ── TABS ── */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setTab('personas'); setPage(1); }}
            className={`flex-1 py-3 rounded-2xl text-sm font-black border-2 cursor-pointer transition-colors ${tab === 'personas' ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
            👤 {es ? `Personas (${todasPersonas.length})` : `People (${todasPersonas.length})`}
          </button>
          <button onClick={() => { setTab('edificios'); setPage(1); }}
            className={`flex-1 py-3 rounded-2xl text-sm font-black border-2 cursor-pointer transition-colors ${tab === 'edificios' ? 'bg-[#C0392B] text-white border-[#C0392B]' : 'bg-white border-gray-200 text-gray-600'}`}>
            🏗️ {es ? `Edificios (${todosEdificios.length})` : `Buildings (${todosEdificios.length})`}
          </button>
        </div>

        {/* Contadores */}
        {!cargando && tab === 'personas' && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-red-700">{sinContacto}</p>
              <p className="text-[10px] font-semibold text-red-600">{es ? 'Sin contacto' : 'Missing'}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-green-700">{localizados}</p>
              <p className="text-[10px] font-semibold text-green-600">{es ? 'Localizados' : 'Located'}</p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-teal-700">{encontradas}</p>
              <p className="text-[10px] font-semibold text-teal-600">{es ? 'Encontrados' : 'Found'}</p>
            </div>
          </div>
        )}
        {!cargando && tab === 'edificios' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-red-700">{criticos}</p>
              <p className="text-[10px] font-semibold text-red-600">{es ? 'Grave / Crítico' : 'Severe / Critical'}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 text-center">
              <p className="text-xl font-black text-orange-700">{atrapados}</p>
              <p className="text-[10px] font-semibold text-orange-600">{es ? 'Con atrapados' : 'With trapped'}</p>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={tab === 'personas'
                ? (es ? 'Nombre, apodo, ciudad, descripción...' : 'Name, nickname, city, description...')
                : (es ? 'Nombre, tipo, ciudad, dirección...' : 'Name, type, city, address...')}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            />
          </div>
          {query && (
            <button onClick={() => { setQuery(''); setPage(1); }} className="text-sm text-gray-400 px-2 cursor-pointer">✕</button>
          )}
        </div>

        {/* Filtros zona */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          <button onClick={() => { setFiltroZona(''); setPage(1); }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${!filtroZona ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
            {es ? 'Toda VZ' : 'All VZ'}
          </button>
          {ZONAS.map(z => (
            <button key={z} onClick={() => { setFiltroZona(z); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${filtroZona === z ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
              {z}
            </button>
          ))}
        </div>

        {/* Filtros personas: estado + fuente */}
        {tab === 'personas' && (
          <>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {ESTADO_FILTROS.map(f => (
                <button key={f.val} onClick={() => { setFiltroEstado(f.val); setPage(1); }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${filtroEstado === f.val ? 'bg-[#B83A52] text-white border-[#B83A52]' : 'bg-white border-gray-200 text-gray-600'}`}>
                  {es ? f.es : f.en}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {FUENTE_FILTROS.map(f => (
                <button key={f.val} onClick={() => { setFiltroFuente(f.val); setPage(1); }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${filtroFuente === f.val ? 'bg-[#6C3483] text-white border-[#6C3483]' : 'bg-white border-gray-200 text-gray-600'}`}>
                  {es ? f.es : f.en}
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'edificios' && <div className="mb-4" />}

        {cargando && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> {es ? 'Cargando todas las bases de datos...' : 'Loading all databases...'}
          </div>
        )}

        {!cargando && (
          <p className="text-xs text-gray-400 mb-3">
            {tab === 'personas'
              ? (es ? `${personasFiltradas.length} persona(s) en ${todasPersonas.length} registros totales` : `${personasFiltradas.length} person(s) from ${todasPersonas.length} total records`)
              : (es ? `${edificiosFiltrados.length} edificio(s) en ${todosEdificios.length} reportes totales` : `${edificiosFiltrados.length} building(s) from ${todosEdificios.length} total reports`)}
          </p>
        )}

        {!cargando && lista.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-3xl">{tab === 'personas' ? '👤' : '🏗️'}</p>
            <p className="text-sm font-semibold text-gray-500">
              {es ? 'No hay resultados para esta búsqueda.' : 'No results for this search.'}
            </p>
            {(query || filtroEstado || filtroZona || filtroFuente) && (
              <button onClick={() => { setQuery(''); setFiltroEstado(''); setFiltroZona(''); setFiltroFuente(''); setPage(1); }}
                className="text-sm text-blue-600 underline cursor-pointer block mx-auto">
                {es ? '← Borrar filtros' : '← Clear filters'}
              </button>
            )}
          </div>
        )}

        {/* ── GRILLA PERSONAS ── */}
        {tab === 'personas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {visibles.map(p => {
              const st = ESTADO_CONFIG[p.estado_caso] || ESTADO_CONFIG['buscando'];
              const esCritico = p.estado_caso === 'buscando';
              const FUENTE_BADGE = {
                busqueda:     { es: '🔴 Desaparecido',    en: '🔴 Missing',      cls: 'bg-red-50 text-red-700' },
                encontrada:   { es: '🙋 Encontrado/a',    en: '🙋 Found',        cls: 'bg-green-50 text-green-700' },
                cris:         { es: '📍 Estoy aquí',      en: '📍 I am here',    cls: 'bg-amber-50 text-amber-700' },
                institucional:{ es: '🏛️ Institucional',   en: '🏛️ Institutional',cls: 'bg-blue-50 text-blue-700' },
                cruce:        { es: '🔗 Búsqueda cruzada',en: '🔗 Cross search', cls: 'bg-purple-50 text-purple-700' },
              };
              const badge = FUENTE_BADGE[p._fuente] || FUENTE_BADGE.cris;
              return (
                <div key={p.id} className={`bg-white rounded-2xl border-2 px-4 py-3 ${esCritico ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex gap-3 items-start">
                    {!lowBw && p.foto_url ? (
                      <img src={p.foto_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${esCritico ? 'bg-red-50' : 'bg-gray-50'}`}>
                        {p._fuente === 'encontrada' ? '🙋' : p._fuente === 'cris' ? '📍' : '👤'}
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
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{es ? badge.es : badge.en}</span>
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
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {p._fuente === 'busqueda' ? (
                      <BotonNotificarme personaId={p.id} nombre={p.nombre_completo} />
                    ) : (
                      <button onClick={() => setPersonaActualizar(p)}
                        className="flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                        ✍️ {es ? 'Actualizar' : 'Update'}
                      </button>
                    )}
                    <button onClick={() => compartir(p)}
                      className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl cursor-pointer ${compartidoId === p.id ? 'bg-green-600 text-white' : 'bg-[#1A1F2E] text-white'}`}>
                      <Share2 size={12} />
                      {compartidoId === p.id ? (es ? '✅ Copiado' : '✅ Copied') : (es ? 'Compartir' : 'Share')}
                    </button>
                  </div>

                  {p._fuente === 'busqueda' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button onClick={() => abrirEncontrar(p)}
                        className="flex items-center justify-center gap-1 text-xs font-bold text-white bg-green-600 py-2 rounded-xl cursor-pointer">
                        ✋ {es ? 'La encontré' : 'I found them'}
                      </button>
                      <Link to={`/persona?id=${p.id}`}
                        className="flex items-center justify-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 py-2 rounded-xl no-underline">
                        <Eye size={11} /> {es ? 'Ver perfil' : 'View profile'}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── GRILLA EDIFICIOS ── */}
        {tab === 'edificios' && (
          <div className="flex flex-col gap-2.5">
            {visibles.map(e => {
              const dano = DANO_CONFIG[e.nivel_dano] || DANO_CONFIG.no_evaluado;
              const esCritico = ['grave', 'critico', 'colapsado'].includes(e.nivel_dano);
              const hayAtrapados = e.personas_atrapadas === 'si';
              return (
                <div key={e.id} className={`bg-white rounded-2xl border-2 px-4 py-3 space-y-2 ${esCritico || hayAtrapados ? 'border-red-300' : 'border-gray-100'}`}>
                  {hayAtrapados && (
                    <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">
                      🆘 {es ? 'PERSONAS ATRAPADAS — PRIORIDAD MÁXIMA' : 'TRAPPED PEOPLE — MAXIMUM PRIORITY'}
                    </div>
                  )}
                  {esCritico && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold px-3 py-1.5 rounded-lg">
                      🚫 {es ? 'NO ENTRAR — Estructura comprometida' : 'DO NOT ENTER — Compromised structure'}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-[#1A1F2E] leading-tight">{e.nombre}</p>
                      {e.tipo && <p className="text-[11px] text-gray-400">{e.tipo}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${dano.bg}`}>
                      {es ? dano.es : dano.en}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={10} /> {[e.direccion, e.ciudad, e.estado_region].filter(Boolean).join(' · ')}
                  </p>
                  {e.riesgos?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {e.riesgos.map(r => (
                        <span key={r} className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">
                          {r === 'gas' ? '⚠️ Gas' : r === 'elec' ? '⚡ Eléctrico' : r === 'fuego' ? '🔥 Incendio' : '💥 Colapso'}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${e._fuente === 'reporte_dano' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                      {e._fuente === 'reporte_dano' ? (es ? '🏗️ Reporte daño' : '🏗️ Damage report') : (es ? '🆘 Infraestructura SOS' : '🆘 SOS Infrastructure')}
                    </span>
                    <Link to={`/edificio?id=${e._rawId}`} className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full no-underline">
                      {es ? 'Ver detalle →' : 'View detail →'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lista.length > visibles.length && (
          <button onClick={() => setPage(p => p + 1)}
            className="w-full mt-4 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-gray-200 rounded-2xl bg-white hover:bg-gray-50 cursor-pointer">
            {es ? `Ver más (${lista.length - visibles.length} restantes)` : `Show more (${lista.length - visibles.length} remaining)`}
          </button>
        )}

        <div className="mt-6">
          <Link to="/buscar-persona"
            className="flex items-center justify-center gap-2 bg-[#B83A52] text-white font-black py-4 rounded-2xl text-base no-underline">
            <Plus size={18} />
            {es ? 'Registrar persona desaparecida' : 'Register missing person'}
          </Link>
        </div>
      </div>

      {personaActualizar && (
        <ActualizacionPersonaRapida
          persona={personaActualizar}
          es={es}
          onClose={() => setPersonaActualizar(null)}
          onSaved={aplicarActualizacionLocal}
        />
      )}

      {/* ── MINI-MODAL: ENCONTRÉ A ALGUIEN ── */}
      {personaEncontrar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => !enviandoEncontradoOk && setPersonaEncontrar(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">✋ {es ? 'Encontré a esta persona' : 'I found this person'}</p>
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
                  <p className="font-black text-green-800 text-base">{es ? '¡Reporte enviado!' : 'Report sent!'}</p>
                  <p className="text-sm text-green-600">{es ? 'El familiar será notificado si está suscrito.' : 'Family will be notified if subscribed.'}</p>
                  <button onClick={() => setPersonaEncontrar(null)} className="text-sm font-bold text-gray-500 underline cursor-pointer">
                    {es ? 'Cerrar' : 'Close'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <span className="text-amber-600 flex-shrink-0">⚠️</span>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      {es
                        ? 'Solo comparte información verificada. No publiques rumores. Nunca envíes dinero a cambio de información.'
                        : 'Only share verified info. Do not spread rumors. Never send money for information.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{es ? 'Condición' : 'Condition'}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 'a_salvo',              es: '✅ A salvo',            en: '✅ Safe' },
                        { val: 'herido_leve',           es: '🩹 Herido leve',        en: '🩹 Minor injury' },
                        { val: 'herido_grave',          es: '🚑 Herido grave',        en: '🚑 Serious injury' },
                        { val: 'fallecido_reportado',   es: '⚫ Fallecido (rep.)',    en: '⚫ Deceased (rep.)' },
                        { val: 'no_identificado',       es: '❓ No identificado',     en: '❓ Unidentified' },
                      ].map(c => (
                        <button key={c.val}
                          onClick={() => setEncontradoForm(f => ({ ...f, condicion: f.condicion === c.val ? '' : c.val }))}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border cursor-pointer text-left ${encontradoForm.condicion === c.val ? 'bg-green-700 text-white border-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                          {es ? c.es : c.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{es ? 'Lugar donde la/lo viste *' : 'Where you saw them *'}</p>
                    <input value={encontradoForm.lugar}
                      onChange={e => setEncontradoForm(f => ({ ...f, lugar: e.target.value }))}
                      placeholder={es ? 'Ej: Refugio Cruz Roja, Av. Principal, Maiquetía' : 'E.g.: Red Cross shelter, Main Ave'}
                      className="w-full border border-green-300 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none bg-white" />
                  </div>

                  <textarea rows={2} value={encontradoForm.notas}
                    onChange={e => setEncontradoForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder={es ? 'Información adicional (estado, acompañantes, etc.)...' : 'Additional info (status, companions, etc.)...'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none bg-white" />

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500">🔒 {es ? 'Tus datos — privados, no se publican' : 'Your info — private, not published'}</p>
                    <input value={encontradoForm.nombre} onChange={e => setEncontradoForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none bg-white" />
                    <input value={encontradoForm.telefono} onChange={e => setEncontradoForm(f => ({ ...f, telefono: e.target.value }))}
                      placeholder={es ? 'Teléfono / WhatsApp (opcional)' : 'Phone / WhatsApp (optional)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none bg-white" />
                    <input value={encontradoForm.email} onChange={e => setEncontradoForm(f => ({ ...f, email: e.target.value }))}
                      placeholder={es ? 'Email (opcional)' : 'Email (optional)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs placeholder-gray-400 focus:outline-none bg-white" />
                  </div>

                  <button onClick={enviarEncontrado}
                    disabled={enviandoEncontrado || (!encontradoForm.condicion && !encontradoForm.lugar)}
                    className="w-full bg-green-700 text-white text-sm font-black py-3.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
                    {enviandoEncontrado ? <Loader2 size={14} className="animate-spin" /> : '📡'}
                    {es ? 'Enviar reporte de hallazgo' : 'Send finding report'}
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
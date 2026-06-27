import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ChevronLeft, Loader2, LayoutGrid, List } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FichaAccionesModal from '@/components/svzla/FichaAccionesModal';

const PAGE_SIZE = 12;

// ── Configuraciones de estado ───────────────────────────────────────────────
const PERSONA_ESTADO = {
  buscando:             { es: '🔴 Sin contacto',        en: '🔴 Missing',           cls: 'bg-red-100 text-red-800 border-red-200' },
  informacion_recibida: { es: '🔵 Con pistas',           en: '🔵 Has leads',         cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  visto_no_confirmado:  { es: '🟠 Visto sin confirmar',  en: '🟠 Seen unconfirmed',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  encontrado_con_vida:  { es: '✅ Localizado',           en: '✅ Located',           cls: 'bg-green-100 text-green-800 border-green-200' },
  en_hospital_refugio:  { es: '🏥 En refugio',           en: '🏥 In shelter',        cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  fallecido_reportado:  { es: '⚫ Fallecido (rep.)',      en: '⚫ Deceased (rep.)',   cls: 'bg-gray-200 text-gray-700 border-gray-300' },
  caso_cerrado:         { es: '🔒 Cerrado',              en: '🔒 Closed',           cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const DANO_CONFIG = {
  leve:        { es: '🟡 Daño leve',  en: '🟡 Minor',    cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  moderado:    { es: '🟠 Moderado',   en: '🟠 Moderate', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  grave:       { es: '🔴 GRAVE',      en: '🔴 SEVERE',   cls: 'bg-red-100 text-red-800 border-red-200' },
  critico:     { es: '🔴 CRÍTICO',    en: '🔴 CRITICAL', cls: 'bg-red-200 text-red-900 border-red-400' },
  colapsado:   { es: '💥 COLAPSADO',  en: '💥 COLLAPSED',cls: 'bg-gray-800 text-white border-gray-700' },
  no_evaluado: { es: '⚪ Sin evaluar',en: '⚪ Unknown',   cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  no_sabe:     { es: '⚪ Sin datos',  en: '⚪ No data',   cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

// ── Categorías de personas ──────────────────────────────────────────────────
const CATEGORIAS_PERSONAS = [
  { id: 'desaparecidos', es: '🔴 Desaparecidos', en: '🔴 Missing', estados: ['buscando', 'informacion_recibida', 'visto_no_confirmado'] },
  { id: 'localizados',   es: '✅ Localizados',   en: '✅ Located',  estados: ['encontrado_con_vida', 'en_hospital_refugio'] },
  { id: 'encontrados',   es: '🙋 Encontrados',   en: '🙋 Found',   estados: ['encontrado_con_vida'], fuente: 'encontrada' },
  { id: 'institucional', es: '🏛️ Institucional', en: '🏛️ Institutional', fuente: 'institucional' },
  { id: 'estoy_aqui',    es: '📍 Estoy aquí',   en: '📍 I am here', fuente: 'cris' },
];

// ── Categorías de edificios ─────────────────────────────────────────────────
const CATEGORIAS_EDIFICIOS = [
  { id: 'criticos',    es: '🆘 Críticos / Atrapados', en: '🆘 Critical / Trapped', niveles: ['critico', 'colapsado'], atrapados: true },
  { id: 'graves',      es: '🔴 Daño grave',           en: '🔴 Severe damage',       niveles: ['grave'] },
  { id: 'moderados',   es: '🟠 Daño moderado',        en: '🟠 Moderate damage',     niveles: ['moderado'] },
  { id: 'leves',       es: '🟡 Daño leve',            en: '🟡 Minor damage',        niveles: ['leve'] },
  { id: 'sin_evaluar', es: '⚪ Sin evaluar',           en: '⚪ Not evaluated',       niveles: ['no_evaluado', 'no_sabe'] },
];

export default function Directorio() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [tab, setTab] = useState('personas'); // 'personas' | 'edificios'
  const [cargando, setCargando] = useState(true);

  // Datos personas
  const [personasBuscadas, setPersonasBuscadas] = useState([]);
  const [personasRegistradas, setPersonasRegistradas] = useState([]);
  const [personasCris, setPersonasCris] = useState([]);
  const [personasEncontradas, setPersonasEncontradas] = useState([]);

  // Datos edificios
  const [reportesDano, setReportesDano] = useState([]);
  const [infraSos, setInfraSos] = useState([]);

  // UI
  const [categoriaPersona, setCategoriaPersona] = useState('desaparecidos');
  const [categoriaEdificio, setCategoriaEdificio] = useState('criticos');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [vistaPersonas, setVistaPersonas] = useState('grid'); // 'grid' | 'lista'
  const [vistaEdificios, setVistaEdificios] = useState('lista'); // 'grid' | 'lista'
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null); // { item, tipo }


  useEffect(() => {
    Promise.all([
      base44.entities.PersonasBuscadas.list('-updated_date', 300),
      base44.entities.PersonaRegistrada.list('-created_date', 200),
      base44.entities.PersonaCRIS.list('-created_date', 200),
      base44.entities.PersonasEncontradas.list('-created_date', 200),
      base44.entities.ReportesDano.list('-created_date', 200),
      base44.entities.InfraestructuraSos.list('-created_date', 200),
    ]).then(([buscadas, registradas, cris, encontradas, danos, sos]) => {
      setPersonasBuscadas(buscadas);
      setPersonasRegistradas(registradas);
      setPersonasCris(cris);
      setPersonasEncontradas(encontradas);
      setReportesDano(danos);
      setInfraSos(sos);
    }).catch(() => {}).finally(() => setCargando(false));
  }, []);

  // ── Unificar personas con fuente ────────────────────────────────────────────
  const todasPersonas = [
    ...personasBuscadas.map(p => ({ ...p, _fuente: 'busqueda', _nombre: p.nombre_completo })),
    ...personasRegistradas.map(r => ({
      ...r, _fuente: 'institucional', _nombre: r.nombre_completo,
      estado_caso: r.condicion === 'a_salvo' ? 'encontrado_con_vida'
        : (r.condicion === 'herido_grave' || r.condicion === 'herido_leve') ? 'en_hospital_refugio'
        : r.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
        : 'informacion_recibida',
      ciudad: r.ciudad, ultima_ubicacion_conocida: r.institucion_nombre || r.ciudad,
    })),
    ...personasCris.map(r => ({
      ...r, _fuente: 'cris',
      _nombre: [r.nombre, r.apellido].filter(Boolean).join(' ') || r.apodo || '—',
      nombre_completo: [r.nombre, r.apellido].filter(Boolean).join(' ') || r.apodo,
      edad_aprox: r.edad_aproximada,
      ultima_ubicacion_conocida: r.ubicacion_texto || r.ultima_ubicacion_conocida || '',
      estado_caso: ['a_salvo', 'estoy_aqui', 'encontrado'].includes(r.estado_actual) ? 'encontrado_con_vida'
        : ['herido', 'atencion_urgente', 'en_hospital'].includes(r.estado_actual) ? 'en_hospital_refugio'
        : 'informacion_recibida',
    })),
    ...personasEncontradas.map(r => ({
      ...r, _fuente: 'encontrada', _nombre: r.nombre_o_descripcion,
      nombre_completo: r.nombre_o_descripcion,
      ultima_ubicacion_conocida: r.nombre_lugar || r.ubicacion_actual || r.ciudad,
      estado_caso: r.condicion === 'a_salvo' ? 'encontrado_con_vida'
        : r.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
        : 'informacion_recibida',
    })),
  ];

  // ── Unificar edificios ──────────────────────────────────────────────────────
  const todosEdificios = [
    ...reportesDano.map(r => ({
      ...r, _fuente: 'reporte_dano', _nombre: r.nombre_lugar || r.tipo_estructura || '—',
      nivel_dano: r.nivel_dano || 'no_evaluado',
      hayAtrapados: r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces',
    })),
    ...infraSos.map(r => ({
      ...r, _fuente: 'infrasos', _nombre: r.tipo_reporte || r.categoria || '—',
      nivel_dano: r.nivel_dano || 'no_evaluado',
      hayAtrapados: r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces',
      tipo_estructura: r.categoria || r.tipo_reporte,
    })),
  ];

  // ── Filtrar personas por categoría ─────────────────────────────────────────
  const filtrarPersonas = (cat) => {
    const catCfg = CATEGORIAS_PERSONAS.find(c => c.id === cat);
    if (!catCfg) return [];
    return todasPersonas.filter(p => {
      const matchEstado = !catCfg.estados || catCfg.estados.includes(p.estado_caso);
      const matchFuente = !catCfg.fuente || p._fuente === catCfg.fuente;
      const matchQuery = !query ||
        (p._nombre || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.ciudad || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.ultima_ubicacion_conocida || '').toLowerCase().includes(query.toLowerCase());
      return matchEstado && matchFuente && matchQuery;
    });
  };

  // ── Filtrar edificios por categoría ────────────────────────────────────────
  const filtrarEdificios = (cat) => {
    const catCfg = CATEGORIAS_EDIFICIOS.find(c => c.id === cat);
    if (!catCfg) return [];
    return todosEdificios.filter(e => {
      const matchNivel = catCfg.niveles.includes(e.nivel_dano) || (cat === 'criticos' && e.hayAtrapados);
      const matchQuery = !query ||
        (e._nombre || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.ciudad || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.direccion || '').toLowerCase().includes(query.toLowerCase());
      return matchNivel && matchQuery;
    });
  };

  const personasFiltradas = filtrarPersonas(categoriaPersona);
  const edificiosFiltrados = filtrarEdificios(categoriaEdificio);
  const lista = tab === 'personas' ? personasFiltradas : edificiosFiltrados;
  const visibles = lista.slice(0, page * PAGE_SIZE);

  // Contadores por categoría
  const contPersonas = CATEGORIAS_PERSONAS.reduce((acc, c) => {
    acc[c.id] = filtrarPersonas(c.id).length;
    return acc;
  }, {});
  const contEdificios = CATEGORIAS_EDIFICIOS.reduce((acc, c) => {
    acc[c.id] = filtrarEdificios(c.id).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-5xl mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          📂 {es ? 'Directorio' : 'Directory'}
        </h1>
        <p className="text-xs text-gray-500 mb-2 leading-relaxed">
          {es
            ? 'Toca cualquier ficha para ver detalles, enviar una actualización o suscribirte a novedades.'
            : 'Tap any card to view details, send an update, or subscribe to alerts.'}
        </p>
        {/* Instrucción de emergencia */}
        <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
          <span className="text-red-500 text-sm flex-shrink-0">⚡</span>
          <p className="text-[11px] text-red-800 leading-snug font-medium">
            {es
              ? 'En emergencia activa: usa el buscador para encontrar rápido. No necesitas cuenta para consultar.'
              : 'Active emergency: use the search bar to find quickly. No account needed to browse.'}
          </p>
        </div>

        {/* ── TABS PRINCIPALES ── */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => { setTab('personas'); setPage(1); }}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-black border-2 cursor-pointer transition-colors ${tab === 'personas' ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
            👤 {es ? `Personas (${todasPersonas.length})` : `People (${todasPersonas.length})`}
          </button>
          <button onClick={() => { setTab('edificios'); setPage(1); }}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-black border-2 cursor-pointer transition-colors ${tab === 'edificios' ? 'bg-[#C0392B] text-white border-[#C0392B]' : 'bg-white border-gray-200 text-gray-600'}`}>
            🏗️ {es ? `Edificios (${todosEdificios.length})` : `Buildings (${todosEdificios.length})`}
          </button>
        </div>

        {/* ── BUSCADOR ── */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder={tab === 'personas'
              ? (es ? 'Buscar por nombre, ciudad...' : 'Search by name, city...')
              : (es ? 'Buscar por nombre, dirección, ciudad...' : 'Search by name, address, city...')}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          {query && (
            <button onClick={() => { setQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs cursor-pointer">✕</button>
          )}
        </div>

        {/* ── CATEGORÍAS PERSONAS ── */}
        {tab === 'personas' && (
          <>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">{es ? 'Filtrar por categoría' : 'Filter by category'}</p>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {CATEGORIAS_PERSONAS.map(c => (
                <button key={c.id} onClick={() => { setCategoriaPersona(c.id); setPage(1); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 cursor-pointer ${categoriaPersona === c.id ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
                  {es ? c.es : c.en}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${categoriaPersona === c.id ? 'bg-white text-[#1A1F2E]' : 'bg-gray-100 text-gray-600'}`}>
                    {contPersonas[c.id]}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── CATEGORÍAS EDIFICIOS ── */}
        {tab === 'edificios' && (
          <>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">{es ? 'Filtrar por nivel de daño' : 'Filter by damage level'}</p>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {CATEGORIAS_EDIFICIOS.map(c => (
                <button key={c.id} onClick={() => { setCategoriaEdificio(c.id); setPage(1); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 cursor-pointer ${categoriaEdificio === c.id
                    ? (c.id === 'criticos' || c.id === 'graves' ? 'bg-red-600 text-white border-red-600' : 'bg-[#1A1F2E] text-white border-[#1A1F2E]')
                    : 'bg-white border-gray-200 text-gray-600'}`}>
                  {es ? c.es : c.en}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${categoriaEdificio === c.id ? 'bg-white text-[#1A1F2E]' : 'bg-gray-100 text-gray-600'}`}>
                    {contEdificios[c.id]}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {cargando && (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> {es ? 'Cargando directorio...' : 'Loading directory...'}
          </div>
        )}

        {!cargando && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">
              {es ? `${lista.length} registro(s)` : `${lista.length} record(s)`}
            </p>
            {/* Toggle vista */}
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => tab === 'personas' ? setVistaPersonas('grid') : setVistaEdificios('grid')}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${(tab === 'personas' ? vistaPersonas : vistaEdificios) === 'grid' ? 'bg-[#1A1F2E] text-white' : 'text-gray-400 hover:text-gray-700'}`}
                title={es ? 'Vista grid' : 'Grid view'}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => tab === 'personas' ? setVistaPersonas('lista') : setVistaEdificios('lista')}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${(tab === 'personas' ? vistaPersonas : vistaEdificios) === 'lista' ? 'bg-[#1A1F2E] text-white' : 'text-gray-400 hover:text-gray-700'}`}
                title={es ? 'Vista lista' : 'List view'}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        )}

        {!cargando && lista.length === 0 && (
          <div className="text-center py-10 space-y-2">
            <p className="text-3xl">{tab === 'personas' ? '👤' : '🏗️'}</p>
            <p className="text-sm text-gray-500 font-semibold">
              {es ? 'No hay registros en esta categoría.' : 'No records in this category.'}
            </p>
            {query && (
              <button onClick={() => { setQuery(''); setPage(1); }} className="text-sm text-blue-600 underline cursor-pointer">
                {es ? '← Borrar búsqueda' : '← Clear search'}
              </button>
            )}
          </div>
        )}

        {/* ── PERSONAS ── */}
        {tab === 'personas' && !cargando && (() => {
          const FUENTE_BADGE = {
            busqueda:     { es: '🔴 Desaparecido',    en: '🔴 Missing',       cls: 'bg-red-50 text-red-700 border-red-200' },
            encontrada:   { es: '🙋 Encontrado',      en: '🙋 Found',         cls: 'bg-green-50 text-green-700 border-green-200' },
            cris:         { es: '📍 Estoy aquí',      en: '📍 I am here',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
            institucional:{ es: '🏛️ Institucional',   en: '🏛️ Institutional', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
          };
          if (vistaPersonas === 'lista') return (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {visibles.map(p => {
                const st = PERSONA_ESTADO[p.estado_caso] || PERSONA_ESTADO['buscando'];
                const badge = FUENTE_BADGE[p._fuente] || FUENTE_BADGE.busqueda;
                const esCritico = p.estado_caso === 'buscando';
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 ${esCritico ? 'border-l-4 border-l-red-400' : ''}`}>
                    <div onClick={() => setFichaSeleccionada({ item: p, tipo: 'persona' })} className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 cursor-pointer ${esCritico ? 'bg-red-50' : 'bg-gray-50'}`}>
                      {p._fuente === 'encontrada' ? '🙋' : p._fuente === 'cris' ? '📍' : '👤'}
                    </div>
                    <div onClick={() => setFichaSeleccionada({ item: p, tipo: 'persona' })} className="flex-1 min-w-0 cursor-pointer">
                      <p className="font-bold text-sm text-[#1A1F2E] truncate">{p._nombre}</p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        <MapPin size={9} />{[p.ultima_ubicacion_conocida, p.ciudad].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{es ? st.es : st.en}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>{es ? badge.es : badge.en}</span>
                      </div>
                      <button onClick={() => setFichaSeleccionada({ item: p, tipo: 'persona' })}
                        className="text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-lg cursor-pointer hover:bg-blue-100 whitespace-nowrap">
                        🔔 {es ? 'Avisar' : 'Notify'}
                      </button>
                      <span onClick={() => setFichaSeleccionada({ item: p, tipo: 'persona' })} className="text-gray-300 text-xs cursor-pointer">›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibles.map(p => {
                const st = PERSONA_ESTADO[p.estado_caso] || PERSONA_ESTADO['buscando'];
                const badge = FUENTE_BADGE[p._fuente] || FUENTE_BADGE.busqueda;
                const esCritico = p.estado_caso === 'buscando';
                return (
                  <div key={p.id}
                    className={`bg-white rounded-2xl border-2 p-4 space-y-2 hover:shadow-md transition-all ${esCritico ? 'border-red-200' : 'border-gray-100'}`}>
                    <div onClick={() => setFichaSeleccionada({ item: p, tipo: 'persona' })} className="cursor-pointer space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-[#1A1F2E] leading-tight">{p._nombre}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.edad_aprox && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{p.edad_aprox} {es ? 'años' : 'yrs'}</span>}
                            {p.sexo && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize">{p.sexo}</span>}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.cls}`}>{es ? st.es : st.en}</span>
                      </div>
                      {(p.ultima_ubicacion_conocida || p.ciudad) && (
                        <p className="text-xs text-gray-500 flex items-start gap-1">
                          <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                          {[p.ultima_ubicacion_conocida, p.ciudad, p.estado_region].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${badge.cls}`}>{es ? badge.es : badge.en}</span>
                      <button
                        onClick={ev => { ev.stopPropagation(); setFichaSeleccionada({ item: p, tipo: 'persona' }); }}
                        className="text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-blue-100 whitespace-nowrap flex-shrink-0">
                        🔔 {es ? 'Avisar' : 'Notify'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── EDIFICIOS ── */}
        {tab === 'edificios' && !cargando && (() => {
          const EdificioCard = ({ e, compact }) => {
            const dano = DANO_CONFIG[e.nivel_dano] || DANO_CONFIG.no_evaluado;
            const esCritico = ['grave', 'critico', 'colapsado'].includes(e.nivel_dano) || e.hayAtrapados;
            const abrir = (ev) => { ev.stopPropagation(); setFichaSeleccionada({ item: e, tipo: 'edificio' }); };
            const irFicha = () => { window.location.href = `/edificio?id=${e.id}`; };

            if (compact) return (
              <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 ${esCritico ? 'border-l-4 border-l-red-500' : ''}`}>
                <div onClick={irFicha} className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 cursor-pointer ${esCritico ? 'bg-red-50' : 'bg-gray-50'}`}>
                  {e.hayAtrapados ? '🆘' : esCritico ? '🚫' : '🏗️'}
                </div>
                <div onClick={irFicha} className="flex-1 min-w-0 cursor-pointer">
                  <p className="font-bold text-sm text-[#1A1F2E] truncate">{e._nombre}</p>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <MapPin size={9} />{[e.direccion, e.ciudad].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dano.cls}`}>{es ? dano.es : dano.en}</span>
                  <button onClick={abrir}
                    className="text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-lg cursor-pointer hover:bg-blue-100 whitespace-nowrap">
                    🔔 {es ? 'Avisar' : 'Notify'}
                  </button>
                  <span onClick={irFicha} className="text-gray-300 text-xs cursor-pointer">›</span>
                </div>
              </div>
            );

            return (
              <div className={`bg-white rounded-2xl border-2 p-4 space-y-2 hover:shadow-md transition-all ${esCritico ? 'border-red-300' : 'border-gray-100'}`}>
                {e.hayAtrapados && <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg">🆘 {es ? 'PERSONAS ATRAPADAS' : 'TRAPPED PEOPLE'}</div>}
                {esCritico && !e.hayAtrapados && <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold px-3 py-1.5 rounded-lg">🚫 {es ? 'NO ENTRAR — Estructura comprometida' : 'DO NOT ENTER — Compromised structure'}</div>}
                <div onClick={irFicha} className="cursor-pointer space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-[#1A1F2E] leading-tight">{e._nombre}</p>
                      {e.tipo_estructura && <p className="text-[11px] text-gray-400 mt-0.5">{e.tipo_estructura}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${dano.cls}`}>{es ? dano.es : dano.en}</span>
                  </div>
                  {(e.direccion || e.ciudad) && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} /> {[e.direccion, e.ciudad, e.estado_region].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {e.riesgo_gas && <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">💨 Gas</span>}
                    {e.riesgo_electrico && <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">⚡ Eléctrico</span>}
                    {e.riesgo_incendio && <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">🔥 Incendio</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                  <button onClick={abrir}
                    className="flex items-center gap-1 text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-blue-100">
                    🔔 {es ? 'Avisar cambios' : 'Notify me'}
                  </button>
                  <button onClick={irFicha}
                    className="flex items-center gap-1 text-[11px] font-semibold bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-gray-100">
                    {es ? 'Ver ficha →' : 'View record →'}
                  </button>
                </div>
              </div>
            );
          };

          if (vistaEdificios === 'lista') return (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {visibles.map(e => <EdificioCard key={e.id} e={e} compact />)}
            </div>
          );
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibles.map(e => <EdificioCard key={e.id} e={e} />)}
            </div>
          );
        })()}

        {lista.length > visibles.length && (
          <button onClick={() => setPage(p => p + 1)}
            className="w-full mt-4 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-gray-200 rounded-2xl bg-white hover:bg-gray-50 cursor-pointer">
            {es ? `Ver más (${lista.length - visibles.length} restantes)` : `Show more (${lista.length - visibles.length} remaining)`}
          </button>
        )}

        {/* Acciones rápidas al fondo */}
        <div className="grid grid-cols-2 gap-2 mt-6">
          <Link to="/buscar-persona" className="flex items-center justify-center gap-1 bg-[#B83A52] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            + {es ? 'Reportar desaparecido' : 'Report missing'}
          </Link>
          <Link to="/reportar-encontrado" className="flex items-center justify-center gap-1 bg-[#1A7A4A] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            🙋 {es ? 'Encontré a alguien' : 'I found someone'}
          </Link>
          <Link to="/reportar-dano" className="flex items-center justify-center gap-1 bg-[#C0392B] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            🏗️ {es ? 'Reportar edificio' : 'Report building'}
          </Link>
          <Link to="/estoy-aqui" className="flex items-center justify-center gap-1 bg-[#784212] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            📍 {es ? 'Estoy aquí' : 'I am here'}
          </Link>
        </div>
      </div>
      <Footer />

      {/* Modal de acciones */}
      {fichaSeleccionada && (
        <FichaAccionesModal
          item={fichaSeleccionada.item}
          tipo={fichaSeleccionada.tipo}
          onClose={() => setFichaSeleccionada(null)}
        />
      )}
    </div>
  );
}
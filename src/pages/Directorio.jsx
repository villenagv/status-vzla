import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, Loader2, LayoutGrid, List } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FichaAccionesModal from '@/components/svzla/FichaAccionesModal';
import PersonaListItem from '@/components/directorio/PersonaListItem';
import PersonaGridCard from '@/components/directorio/PersonaGridCard';
import EdificioCard from '@/components/directorio/EdificioCard';
import { CATEGORIAS_PERSONAS, CATEGORIAS_EDIFICIOS, PRIORIDAD_SORT } from '@/components/directorio/directorioConfig';

const PAGE_SIZE = 12;

export default function Directorio() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  const [tab, setTab] = useState('personas'); // 'personas' | 'edificios'
  const [cargando, setCargando] = useState(true);

  // Datos personas
  const [personasBuscadas, setPersonasBuscadas] = useState([]);
  const [personasRegistradas, setPersonasRegistradas] = useState([]);
  const [personasCris, setPersonasCris] = useState([]);
  const [personasEncontradas, setPersonasEncontradas] = useState([]);

  // Datos edificios — fuente única: ReportesDano
  const [reportesDano, setReportesDano] = useState([]);

  // UI
  const [categoriaPersona, setCategoriaPersona] = useState('desaparecidos');
  const [categoriaEdificio, setCategoriaEdificio] = useState('moderados');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [vistaPersonas, setVistaPersonas] = useState('grid'); // 'grid' | 'lista'
  const [vistaEdificios, setVistaEdificios] = useState('lista'); // 'grid' | 'lista'
  const [ordenEdificios, setOrdenEdificios] = useState('recientes'); // 'recientes' | 'prioridad' | 'alfabetico'
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null); // { item, tipo }


  useEffect(() => {
    Promise.all([
      base44.entities.PersonasBuscadas.list('-updated_date', 2000),
      base44.entities.PersonaRegistrada.list('-created_date', 1000),
      base44.entities.PersonaCRIS.list('-created_date', 500),
      base44.entities.PersonasEncontradas.list('-created_date', 1000),
      base44.entities.ReportesDano.list('-updated_date', 2000),
    ]).then(([buscadas, registradas, cris, encontradas, danos]) => {
      setPersonasBuscadas(buscadas);
      setPersonasRegistradas(registradas);
      setPersonasCris(cris);
      setPersonasEncontradas(encontradas);
      setReportesDano(danos);
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

  // ── Unificar edificios — fuente única: ReportesDano ───────────────────────
  const todosEdificios = reportesDano.map(r => ({
    ...r,
    _fuente: 'reporte_dano',
    _nombre: r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || '—',
    nivel_dano: r.nivel_dano || 'no_evaluado',
    hayAtrapados: r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces',
  }));

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
    }).sort((a, b) => {
      if (ordenEdificios === 'alfabetico') return (a._nombre || '').localeCompare(b._nombre || '');
      if (ordenEdificios === 'prioridad') return (PRIORIDAD_SORT[a.nivel_dano] ?? 5) - (PRIORIDAD_SORT[b.nivel_dano] ?? 5);
      // recientes por defecto
      return new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date);
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
          <ChevronLeft size={16} /> {t('Volver', 'Go back', 'Voltar')}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          📂 {t('Directorio', 'Directory', 'Diretório')}
        </h1>
        <p className="text-xs text-gray-500 mb-2 leading-relaxed">
          {t(
            'Toca cualquier ficha para ver detalles, enviar una actualización o suscribirte a novedades.',
            'Tap any card to view details, send an update, or subscribe to alerts.',
            'Toque qualquer ficha para ver detalhes, enviar uma atualização ou se inscrever em novidades.'
          )}
        </p>
        {/* Instrucción de emergencia */}
        <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
          <span className="text-red-500 text-sm flex-shrink-0">⚡</span>
          <p className="text-[11px] text-red-800 leading-snug font-medium">
            {t(
              'En emergencia activa: usa el buscador para encontrar rápido. No necesitas cuenta para consultar.',
              'Active emergency: use the search bar to find quickly. No account needed to browse.',
              'Em emergência ativa: use o buscador para encontrar rapidamente. Não precisa de conta para consultar.'
            )}
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
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
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
            {/* Ordenamiento */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">{es ? 'Orden:' : 'Sort:'}</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                {[
                  { key: 'recientes', es: '🕐 Recientes', en: '🕐 Recent' },
                  { key: 'prioridad', es: '🚨 Prioridad', en: '🚨 Priority' },
                  { key: 'alfabetico', es: 'A–Z', en: 'A–Z' },
                ].map(o => (
                  <button key={o.key} onClick={() => { setOrdenEdificios(o.key); setPage(1); }}
                    className={`px-3 py-1.5 text-[10px] font-semibold cursor-pointer transition-colors border-l border-gray-200 first:border-l-0 ${ordenEdificios === o.key ? 'bg-[#1A1F2E] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {es ? o.es : o.en}
                  </button>
                ))}
              </div>
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
                className={`p-2.5 rounded-lg cursor-pointer transition-colors ${(tab === 'personas' ? vistaPersonas : vistaEdificios) === 'grid' ? 'bg-[#1A1F2E] text-white' : 'text-gray-400 hover:text-gray-700'}`}
                title={es ? 'Vista grid' : 'Grid view'}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => tab === 'personas' ? setVistaPersonas('lista') : setVistaEdificios('lista')}
                className={`p-2.5 rounded-lg cursor-pointer transition-colors ${(tab === 'personas' ? vistaPersonas : vistaEdificios) === 'lista' ? 'bg-[#1A1F2E] text-white' : 'text-gray-400 hover:text-gray-700'}`}
                title={es ? 'Vista lista' : 'List view'}
              >
                <List size={16} />
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
        {tab === 'personas' && !cargando && (
          vistaPersonas === 'lista' ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {visibles.map(p => (
                <PersonaListItem key={p.id} p={p} es={es} onSelect={() => setFichaSeleccionada({ item: p, tipo: 'persona' })} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibles.map(p => (
                <PersonaGridCard key={p.id} p={p} es={es} onSelect={() => setFichaSeleccionada({ item: p, tipo: 'persona' })} />
              ))}
            </div>
          )
        )}

        {/* ── EDIFICIOS ── */}
        {tab === 'edificios' && !cargando && (
          vistaEdificios === 'lista' ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {visibles.map(e => (
                <EdificioCard key={e.id} e={e} es={es} lang={lang} compact onNotify={(item) => setFichaSeleccionada({ item, tipo: 'edificio' })} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibles.map(e => (
                <EdificioCard key={e.id} e={e} es={es} lang={lang} onNotify={(item) => setFichaSeleccionada({ item, tipo: 'edificio' })} />
              ))}
            </div>
          )
        )}

        {lista.length > visibles.length && (
          <button onClick={() => setPage(p => p + 1)}
            className="w-full mt-4 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-gray-200 rounded-2xl bg-white hover:bg-gray-50 cursor-pointer">
            {es ? `Ver más (${lista.length - visibles.length} restantes)` : `Show more (${lista.length - visibles.length} remaining)`}
          </button>
        )}

        {/* Acciones rápidas al fondo */}
        <div className="grid grid-cols-2 gap-2 mt-6">
          <Link to="/buscar-persona" className="flex items-center justify-center gap-1 bg-[#B83A52] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            + {t('Reportar desaparecido', 'Report missing', 'Reportar desaparecido')}
          </Link>
          <Link to="/reportar-encontrado" className="flex items-center justify-center gap-1 bg-[#1A7A4A] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            🙋 {t('Encontré a alguien', 'I found someone', 'Encontrei alguém')}
          </Link>
          <Link to="/reportar-dano" className="flex items-center justify-center gap-1 bg-[#C0392B] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            🏗️ {t('Reportar edificio', 'Report building', 'Reportar edifício')}
          </Link>
          <Link to="/estoy-aqui" className="flex items-center justify-center gap-1 bg-[#784212] text-white font-bold py-3.5 rounded-2xl text-xs no-underline">
            📍 {t('Estoy aquí', 'I am here', 'Estou aqui')}
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
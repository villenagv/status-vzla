import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Map, List, Filter, X, Loader2, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import 'leaflet/dist/leaflet.css';

const DANO_CONFIG = {
  leve:        { color: '#D97706', bg: '#FEF3C7', label: { es: 'Leve',        en: 'Minor'     }, pill: 'bg-amber-500'   },
  moderado:    { color: '#EA580C', bg: '#FFEDD5', label: { es: 'Moderado',    en: 'Moderate'  }, pill: 'bg-orange-600'  },
  grave:       { color: '#DC2626', bg: '#FEE2E2', label: { es: 'Grave',       en: 'Severe'    }, pill: 'bg-red-600'     },
  critico:     { color: '#7F1D1D', bg: '#FEE2E2', label: { es: 'Crítico',     en: 'Critical'  }, pill: 'bg-red-900'     },
  colapsado:   { color: '#1F2937', bg: '#F3F4F6', label: { es: 'Colapsado',   en: 'Collapsed' }, pill: 'bg-gray-800'    },
  no_evaluado: { color: '#6B7280', bg: '#F9FAFB', label: { es: 'Sin evaluar', en: 'Unknown'   }, pill: 'bg-gray-500'    },
};

// Coordenadas aproximadas de ciudades venezolanas para geocodificación básica
const COORDS_CIUDAD = {
  'caracas':          [10.4806, -66.9036],
  'la guaira':        [10.6008, -66.9329],
  'vargas':           [10.6008, -66.9329],
  'maracaibo':        [10.6315, -71.6361],
  'valencia':         [10.1620, -68.0070],
  'barquisimeto':     [10.0647, -69.3571],
  'maracay':          [10.2469, -67.5962],
  'maturín':          [9.7458,  -63.1819],
  'ciudad bolívar':   [8.1224,  -63.5497],
  'barcelona':        [10.1243, -64.6894],
  'cumana':           [10.4630, -64.1660],
  'mérida':           [8.5982,  -71.1441],
  'san cristóbal':    [7.7680,  -72.2250],
  'puerto ordaz':     [8.3001,  -62.7253],
  'barinas':          [8.6207,  -70.2070],
  'guanare':          [9.0441,  -69.7467],
  'acarigua':         [9.5601,  -69.1997],
  'punto fijo':       [11.7010, -70.2170],
  'coro':             [11.4049, -69.6682],
  'los teques':       [10.3499, -67.0440],
  'turmero':          [10.2237, -67.4697],
  'cabimas':          [10.3900, -71.4564],
  'carabobo':         [10.1620, -68.0070],
};

function getCoords(reporte) {
  if (reporte.lat && reporte.lng) return [reporte.lat, reporte.lng];
  const ciudad = (reporte.ciudad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, coords] of Object.entries(COORDS_CIUDAD)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (ciudad.includes(keyNorm) || keyNorm.includes(ciudad)) return coords;
  }
  return null;
}

const FILTROS_DANO = ['todos', 'critico', 'colapsado', 'grave', 'moderado', 'leve', 'no_evaluado'];

export default function MapaDanos() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mapaCargado, setMapaCargado] = useState(false);
  const [vistaLista, setVistaLista] = useState(false);
  const [filtroDano, setFiltroDano] = useState('todos');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [error, setError] = useState(false);

  const t = (e, en) => es ? e : en;

  const cargarDatos = async () => {
    setCargando(true);
    setError(false);
    try {
      const data = await base44.entities.ReportesDano.list('-updated_date', 500);
      setReportes(data || []);
    } catch {
      setError(true);
    }
    setCargando(false);
  };

  const cargarMapa = async () => {
    if (mapaCargado) return;
    await cargarDatos();
    setMapaCargado(true);
  };

  // Reportes con coordenadas
  const reportesConCoords = useMemo(() =>
    reportes.map(r => ({ ...r, _coords: getCoords(r) })).filter(r => r._coords),
  [reportes]);

  // Ciudades únicas
  const ciudades = useMemo(() => {
    const mapa = {};
    reportes.forEach(r => {
      const c = r.ciudad || t('Sin ciudad', 'No city');
      if (!mapa[c]) mapa[c] = { total: 0, critico: 0, grave: 0, moderado: 0, leve: 0 };
      mapa[c].total++;
      if (['critico', 'colapsado'].includes(r.nivel_dano)) mapa[c].critico++;
      else if (r.nivel_dano === 'grave') mapa[c].grave++;
      else if (r.nivel_dano === 'moderado') mapa[c].moderado++;
      else if (r.nivel_dano === 'leve') mapa[c].leve++;
    });
    return Object.entries(mapa).sort((a, b) => b[1].total - a[1].total);
  }, [reportes]);

  // Filtrado
  const reportesFiltrados = useMemo(() => {
    return reportesConCoords.filter(r => {
      const passDano = filtroDano === 'todos' || r.nivel_dano === filtroDano;
      const passCiudad = !ciudadSeleccionada || (r.ciudad || '') === ciudadSeleccionada;
      return passDano && passCiudad;
    });
  }, [reportesConCoords, filtroDano, ciudadSeleccionada]);

  // Centro del mapa: si hay ciudad seleccionada, centrar ahí; si no, Venezuela
  const centroMapa = useMemo(() => {
    if (ciudadSeleccionada && reportesFiltrados.length > 0) {
      return reportesFiltrados[0]._coords;
    }
    return [8.0, -66.5];
  }, [ciudadSeleccionada, reportesFiltrados]);

  const zoomMapa = ciudadSeleccionada ? 12 : 6;

  if (lowBw) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
        <TopBar />
        <div className="flex-1 max-w-lg mx-auto px-4 py-6 w-full">
          <Link to="/edificios" className="flex items-center gap-1 text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <ChevronLeft size={15} /> {t('Edificios', 'Buildings')}
          </Link>
          <div className="cris-card text-center py-8">
            <Map size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <p className="text-sm font-bold" style={{ color: '#F0F6FC' }}>{t('Mapa desactivado en modo bajo consumo', 'Map disabled in low-bandwidth mode')}</p>
            <p className="text-xs mt-2 mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('Para cuidar tus datos. Usa el directorio de edificios.', 'To save your data. Use the buildings directory.')}
            </p>
            <Link to="/edificios" className="inline-flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-xl no-underline" style={{ background: '#2471A3', color: '#fff' }}>
              <List size={15} /> {t('Ver directorio de edificios', 'View buildings directory')}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      <TopBar />

      <div className="flex-1 flex flex-col" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 0 0 0' }}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <Link to="/edificios" className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <ChevronLeft size={15} /> {t('Edificios', 'Buildings')}
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-lg font-black" style={{ color: '#F0F6FC' }}>
                🗺️ {t('Mapa de daños', 'Damage map')}
              </h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {t('Edificios reportados en Venezuela · Datos de la comunidad', 'Reported buildings in Venezuela · Community data')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVistaLista(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {vistaLista ? <><Map size={13} /> {t('Mapa', 'Map')}</> : <><List size={13} /> {t('Lista', 'List')}</>}
              </button>
              {/* Botón panel en móvil */}
              <button
                onClick={() => setPanelAbierto(v => !v)}
                className="md:hidden flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Filter size={13} /> {t('Filtros', 'Filters')}
                {(filtroDano !== 'todos' || ciudadSeleccionada) && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">!</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filtros de daño (pills) — siempre visibles */}
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {FILTROS_DANO.map(f => {
            const cfg = DANO_CONFIG[f];
            const active = filtroDano === f;
            const label = f === 'todos' ? t('Todos', 'All') : (cfg ? t(cfg.label.es, cfg.label.en) : f);
            return (
              <button
                key={f}
                onClick={() => setFiltroDano(f)}
                className="rounded-full text-xs font-semibold px-3 py-1.5 cursor-pointer transition-colors border"
                style={active
                  ? { background: cfg ? cfg.color : '#374151', color: '#fff', borderColor: 'transparent' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }
                }
              >
                {f !== 'todos' && cfg && <span className="mr-1">{
                  f === 'critico' ? '🚨' : f === 'colapsado' ? '💥' : f === 'grave' ? '🔴' : f === 'moderado' ? '🟠' : f === 'leve' ? '🟡' : '⚪'
                }</span>}
                {label}
              </button>
            );
          })}
          {(filtroDano !== 'todos' || ciudadSeleccionada) && (
            <button
              onClick={() => { setFiltroDano('todos'); setCiudadSeleccionada(''); }}
              className="rounded-full text-xs font-semibold px-3 py-1.5 cursor-pointer flex items-center gap-1"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <X size={10} /> {t('Limpiar', 'Clear')}
            </button>
          )}
        </div>

        {/* Cuerpo: panel + mapa */}
        <div className="flex flex-1 relative" style={{ minHeight: 500 }}>

          {/* Panel lateral — desktop siempre visible, mobile drawer */}
          <aside
            className={`
              md:flex flex-col
              ${panelAbierto ? 'flex' : 'hidden'}
              md:relative absolute inset-y-0 left-0 z-30
            `}
            style={{
              width: 200,
              background: '#fff',
              borderRight: '1px solid rgba(0,0,0,0.08)',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {/* Header panel */}
            <div className="flex items-center justify-between px-3 py-2.5 sticky top-0 bg-white border-b border-gray-100 z-10">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wide">📍 {t('Ciudades', 'Cities')}</span>
              <button onClick={() => setPanelAbierto(false)} className="md:hidden text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={14} />
              </button>
            </div>

            {/* Opción "Todas" */}
            <button
              onClick={() => { setCiudadSeleccionada(''); setPanelAbierto(false); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold cursor-pointer transition-colors"
              style={{
                background: !ciudadSeleccionada ? '#1E3A5F' : 'transparent',
                color: !ciudadSeleccionada ? '#fff' : '#374151',
              }}
            >
              🇻🇪 {t('Toda Venezuela', 'All Venezuela')}
              <span className="ml-1 text-[10px] opacity-60">({reportes.length})</span>
            </button>

            {/* Lista de ciudades */}
            {ciudades.map(([ciudad, stats]) => {
              const active = ciudadSeleccionada === ciudad;
              const pct_critico = stats.total > 0 ? Math.round((stats.critico / stats.total) * 100) : 0;
              const pct_grave   = stats.total > 0 ? Math.round((stats.grave   / stats.total) * 100) : 0;
              const pct_mod     = stats.total > 0 ? Math.round((stats.moderado/ stats.total) * 100) : 0;
              const pct_leve    = stats.total > 0 ? Math.round((stats.leve    / stats.total) * 100) : 0;
              return (
                <button
                  key={ciudad}
                  onClick={() => { setCiudadSeleccionada(ciudad); setPanelAbierto(false); }}
                  className="w-full text-left px-3 py-2.5 cursor-pointer transition-colors border-b"
                  style={{
                    background: active ? '#EFF6FF' : 'transparent',
                    borderColor: '#F3F4F6',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-800 truncate pr-1">{ciudad}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{stats.total}</span>
                  </div>
                  {/* Barra de color proporcional */}
                  <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                    {pct_critico > 0 && <div style={{ width: `${pct_critico}%`, background: DANO_CONFIG.critico.color }} />}
                    {pct_grave   > 0 && <div style={{ width: `${pct_grave}%`,   background: DANO_CONFIG.grave.color   }} />}
                    {pct_mod     > 0 && <div style={{ width: `${pct_mod}%`,     background: DANO_CONFIG.moderado.color}} />}
                    {pct_leve    > 0 && <div style={{ width: `${pct_leve}%`,    background: DANO_CONFIG.leve.color    }} />}
                    <div style={{ flex: 1, background: '#E5E7EB' }} />
                  </div>
                </button>
              );
            })}

            {!mapaCargado && ciudades.length === 0 && (
              <p className="text-xs text-gray-400 px-3 py-4 text-center">{t('Carga el mapa para ver ciudades', 'Load the map to see cities')}</p>
            )}
          </aside>

          {/* Contenido principal: mapa o lista */}
          <div className="flex-1 relative" style={{ minHeight: 500 }}>

            {!mapaCargado ? (
              /* Pantalla de carga inicial */
              <div className="flex flex-col items-center justify-center h-full gap-4 px-4 py-12">
                <div className="text-center">
                  <p className="text-5xl mb-3">🗺️</p>
                  <h2 className="text-base font-black mb-1" style={{ color: '#F0F6FC' }}>
                    {t('Mapa de daños estructurales', 'Structural damage map')}
                  </h2>
                  <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {t('Datos en tiempo real de la comunidad. Se alimenta del directorio de edificios.', 'Real-time community data. Feeds from the buildings directory.')}
                  </p>
                  <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    ⚠️ {t('Cargar el mapa consume datos móviles.', 'Loading the map uses mobile data.')}
                  </p>
                  <button
                    onClick={cargarMapa}
                    disabled={cargando}
                    className="flex items-center gap-2 mx-auto text-sm font-black px-8 py-4 rounded-2xl cursor-pointer disabled:opacity-50"
                    style={{ background: '#2471A3', color: '#fff' }}
                  >
                    {cargando ? <Loader2 size={16} className="animate-spin" /> : <Map size={16} />}
                    {cargando ? t('Cargando...', 'Loading...') : t('Cargar mapa', 'Load map')}
                  </button>
                  <Link to="/edificios" className="block text-xs mt-3 no-underline" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {t('Ver directorio sin mapa →', 'View directory without map →')}
                  </Link>
                </div>
              </div>

            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
                <AlertTriangle size={28} style={{ color: '#FCA5A5' }} />
                <p className="text-sm font-bold text-center" style={{ color: '#F0F6FC' }}>{t('Error cargando datos', 'Error loading data')}</p>
                <button onClick={cargarDatos} className="text-xs px-4 py-2 rounded-lg cursor-pointer" style={{ background: '#2471A3', color: '#fff' }}>
                  {t('Reintentar', 'Retry')}
                </button>
              </div>

            ) : vistaLista ? (
              /* Vista lista */
              <div className="overflow-y-auto h-full" style={{ background: '#0D1117' }}>
                <div className="px-4 py-3">
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {reportesFiltrados.length} {t('edificio(s) con ubicación', 'building(s) with location')}
                    {ciudadSeleccionada && ` · ${ciudadSeleccionada}`}
                  </p>
                  <div className="space-y-2">
                    {reportesFiltrados.map(r => {
                      const cfg = DANO_CONFIG[r.nivel_dano] || DANO_CONFIG.no_evaluado;
                      return (
                        <Link
                          key={r.id}
                          to={`/edificio?id=${r.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl no-underline"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <span className="text-lg flex-shrink-0">
                            {r.nivel_dano === 'critico' ? '🚨' : r.nivel_dano === 'colapsado' ? '💥' : r.nivel_dano === 'grave' ? '🔴' : r.nivel_dano === 'moderado' ? '🟠' : r.nivel_dano === 'leve' ? '🟡' : '⚪'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: '#F0F6FC' }}>
                              {r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || t('Sin nombre', 'Unnamed')}
                            </p>
                            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              📍 {[r.direccion, r.ciudad].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: cfg.color, color: '#fff' }}>
                            {t(cfg.label.es, cfg.label.en)}
                          </span>
                        </Link>
                      );
                    })}
                    {reportesFiltrados.length === 0 && (
                      <p className="text-center text-sm py-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {t('Sin resultados para este filtro.', 'No results for this filter.')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            ) : (
              /* Vista mapa */
              <div className="relative h-full" style={{ minHeight: 500 }}>
                <MapContainer
                  key={`${centroMapa[0]}-${centroMapa[1]}-${zoomMapa}`}
                  center={centroMapa}
                  zoom={zoomMapa}
                  style={{ height: '100%', minHeight: 500, width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {reportesFiltrados.map(r => {
                    const cfg = DANO_CONFIG[r.nivel_dano] || DANO_CONFIG.no_evaluado;
                    const noEntrar = ['grave', 'critico', 'colapsado'].includes(r.nivel_dano);
                    return (
                      <CircleMarker
                        key={r.id}
                        center={r._coords}
                        radius={noEntrar ? 9 : 7}
                        pathOptions={{
                          fillColor: cfg.color,
                          color: noEntrar ? '#fff' : cfg.color,
                          weight: noEntrar ? 2 : 1,
                          fillOpacity: 0.85,
                        }}
                      >
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <p className="font-bold text-sm text-gray-900 mb-1">
                              {r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || t('Sin nombre', 'Unnamed')}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">📍 {[r.direccion, r.ciudad].filter(Boolean).join(' · ')}</p>
                            <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white mb-2"
                              style={{ background: cfg.color }}>
                              {t(cfg.label.es, cfg.label.en)}
                            </span>
                            {noEntrar && (
                              <p className="text-xs font-black text-red-700">🚫 {t('NO ENTRAR', 'DO NOT ENTER')}</p>
                            )}
                            {r.personas_atrapadas === 'si' && (
                              <p className="text-xs font-bold text-red-600 mt-1">🆘 {t('Personas atrapadas', 'Trapped people')}</p>
                            )}
                            <a href={`/edificio?id=${r.id}`} className="block text-xs text-blue-600 mt-2 font-semibold">
                              {t('Ver ficha →', 'View record →')}
                            </a>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {/* Contador sobre el mapa */}
                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                  <div className="bg-white/90 rounded-xl px-3 py-2 shadow-md">
                    <p className="text-xs font-black text-gray-800">
                      {reportesFiltrados.length} {t('edificio(s)', 'building(s)')}
                    </p>
                    {ciudadSeleccionada && (
                      <p className="text-[10px] text-gray-500">📍 {ciudadSeleccionada}</p>
                    )}
                  </div>
                </div>

                {/* Leyenda inferior derecha */}
                <div className="absolute bottom-6 right-3 z-20 pointer-events-none">
                  <div className="bg-white/92 rounded-xl px-3 py-2.5 shadow-md" style={{ minWidth: 130 }}>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide mb-1.5">
                      {t('Nivel de daño', 'Damage level')}
                    </p>
                    {(['critico', 'colapsado', 'grave', 'moderado', 'leve', 'no_evaluado']).map(d => {
                      const cfg = DANO_CONFIG[d];
                      return (
                        <div key={d} className="flex items-center gap-1.5 mb-1">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                          <span className="text-[10px] text-gray-700 font-medium">{t(cfg.label.es, cfg.label.en)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enlace al directorio */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link to="/edificios" className="text-xs no-underline flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
            <List size={12} /> {t('Ver directorio completo', 'View full directory')}
          </Link>
          <Link to="/reportar-dano" className="text-xs font-bold px-3 py-1.5 rounded-lg no-underline" style={{ background: '#C0392B', color: '#fff' }}>
            + {t('Reportar daño', 'Report damage')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
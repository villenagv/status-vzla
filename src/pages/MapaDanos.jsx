import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Map, List, Search, RotateCcw, X, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

// ── Configuración de colores por nivel de daño ──
const DANO_COLOR = {
  colapsado:   '#dc2626',
  critico:     '#ef4444',
  grave:       '#d97706',
  moderado:    '#f59e0b',
  leve:        '#16a34a',
  no_evaluado: '#9ca3af',
};
const DANO_LABEL = {
  colapsado:   { es: 'Colapsado',   en: 'Collapsed'   },
  critico:     { es: 'Crítico',     en: 'Critical'     },
  grave:       { es: 'Grave',       en: 'Severe'       },
  moderado:    { es: 'Moderado',    en: 'Moderate'     },
  leve:        { es: 'Leve',        en: 'Minor'        },
  no_evaluado: { es: 'Sin evaluar', en: 'Not evaluated'},
};
const DANO_PESO = {
  colapsado: 1.0, critico: 0.8, grave: 0.6,
  moderado: 0.4, leve: 0.2, no_evaluado: 0.1,
};
const ATRAPADOS_ALERTA = ['si', 'voces', 'posible'];
const FILTROS = ['todos', 'colapsado', 'critico', 'grave', 'moderado', 'leve', 'no_evaluado'];

// ── Coordenadas por ciudad para fallback ──
const CIUDAD_COORDS = {
  'caracas': [10.4806, -66.9036], 'maracaibo': [10.6317, -71.6408],
  'valencia': [10.1621, -68.0077], 'barquisimeto': [10.0678, -69.3127],
  'maracay': [10.2469, -67.5958], 'barcelona': [10.1167, -64.7000],
  'puerto la cruz': [10.2153, -64.6387], 'maturin': [9.7453, -63.1804],
  'ciudad bolivar': [8.1226, -63.5497], 'san cristobal': [7.7662, -72.2252],
  'merida': [8.6320, -71.1375], 'guanare': [9.0427, -69.7484],
  'barinas': [8.6222, -70.2083], 'cumana': [10.4631, -63.8533],
  'punto fijo': [11.7066, -70.1990], 'coro': [11.4040, -69.6735],
  'la guaira': [10.6028, -66.9351], 'vargas': [10.6028, -66.9351],
  'catia la mar': [10.5906, -66.9561], 'guarenas': [10.4728, -66.5369],
  'guatire': [10.4728, -66.5369], 'los teques': [10.3458, -67.0392],
  'turmero': [10.2284, -67.4797], 'cagua': [10.1916, -67.4604],
  'villa de cura': [10.0276, -67.4930], 'san juan de los morros': [9.9067, -67.3557],
  'el tigre': [8.8860, -64.2531], 'mene grande': [9.8167, -70.9333],
  'cabimas': [10.3975, -71.4558], 'lagunillas': [10.1325, -71.2597],
};

function getCoordsFromRecord(r) {
  if (r.lat && r.lng) return [r.lat, r.lng];
  const ciudad = (r.ciudad || '').toLowerCase().trim();
  return CIUDAD_COORDS[ciudad] || null;
}

// ── Resumen por estado ──
function calcResumenEstados(reportes) {
  const map = {};
  for (const r of reportes) {
    const e = r.estado_region || 'Sin estado';
    if (!map[e]) map[e] = { total: 0, colapsado: 0, critico: 0, grave: 0, moderado: 0, leve: 0, no_evaluado: 0 };
    map[e].total++;
    map[e][r.nivel_dano || 'no_evaluado'] = (map[e][r.nivel_dano || 'no_evaluado'] || 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
}

function calcResumenCiudades(reportes) {
  const map = {};
  for (const r of reportes) {
    const c = r.ciudad || 'Sin ciudad';
    if (!map[c]) map[c] = { total: 0, maxDano: 'no_evaluado', lat: null, lng: null };
    map[c].total++;
    const pesoActual = DANO_PESO[map[c].maxDano] || 0;
    if ((DANO_PESO[r.nivel_dano] || 0) > pesoActual) map[c].maxDano = r.nivel_dano;
    if (!map[c].lat) {
      const coords = getCoordsFromRecord(r);
      if (coords) { map[c].lat = coords[0]; map[c].lng = coords[1]; }
    }
  }
  return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
}

export default function MapaDanos() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const t = (esStr, enStr) => es ? esStr : enStr;

  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState('calor'); // calor | zonas | edificios
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [mapaListo, setMapaListo] = useState(false);
  const [mapaIniciar, setMapaIniciar] = useState(!lowBw);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({ heat: null, cluster: null, markers: null });
  const scriptsRef = useRef({ leaflet: false, heat: false, cluster: false });

  // ── Cargar datos ──
  useEffect(() => {
    base44.entities.ReportesDano.list('-updated_date', 500)
      .then(d => setReportes(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  // ── Reportes filtrados ──
  const reportesFiltrados = reportes.filter(r => {
    const passNivel = filtroNivel === 'todos' || r.nivel_dano === filtroNivel;
    const q = busqueda.toLowerCase().trim();
    const passQ = !q || (r.ciudad || '').toLowerCase().includes(q)
      || (r.nombre_lugar || '').toLowerCase().includes(q)
      || (r.direccion || '').toLowerCase().includes(q);
    return passNivel && passQ;
  });

  const reportesConCoords = reportesFiltrados.filter(r => getCoordsFromRecord(r));

  // ── Cargar scripts de Leaflet ──
  const cargarScripts = useCallback(() => {
    return new Promise((resolve) => {
      if (window.L) { resolve(); return; }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const s1 = document.createElement('script');
      s1.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s1.onload = () => {
        const s2 = document.createElement('script');
        s2.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        s2.onload = () => {
          const link2 = document.createElement('link');
          link2.rel = 'stylesheet';
          link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
          document.head.appendChild(link2);
          const link3 = document.createElement('link');
          link3.rel = 'stylesheet';
          link3.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
          document.head.appendChild(link3);
          const s3 = document.createElement('script');
          s3.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
          s3.onload = () => resolve();
          document.head.appendChild(s3);
        };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    });
  }, []);

  // ── Inicializar mapa ──
  const inicializarMapa = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    await cargarScripts();
    const L = window.L;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
      .setView([10.3, -66.9], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
    map.on('zoomend', () => actualizarVistaPorZoom(map.getZoom()));
    setMapaListo(true);
  }, [cargarScripts]);

  useEffect(() => {
    if (mapaIniciar && !lowBw) inicializarMapa();
  }, [mapaIniciar, lowBw, inicializarMapa]);

  // ── Actualizar vista según zoom ──
  const actualizarVistaPorZoom = useCallback((zoom) => {
    if (zoom < 8) setVistaActiva('calor');
    else if (zoom <= 11) setVistaActiva('zonas');
    else setVistaActiva('edificios');
  }, []);

  // ── Renderizar capas ──
  useEffect(() => {
    if (!mapaListo || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Limpiar capas anteriores
    if (layersRef.current.heat) { map.removeLayer(layersRef.current.heat); layersRef.current.heat = null; }
    if (layersRef.current.cluster) { map.removeLayer(layersRef.current.cluster); layersRef.current.cluster = null; }
    if (layersRef.current.markers) { map.removeLayer(layersRef.current.markers); layersRef.current.markers = null; }

    const puntos = reportesConCoords.map(r => getCoordsFromRecord(r) ? { r, coords: getCoordsFromRecord(r) } : null).filter(Boolean);

    if (vistaActiva === 'calor' && window.L.heatLayer) {
      const heatData = puntos.map(({ r, coords }) => [...coords, DANO_PESO[r.nivel_dano] || 0.1]);
      const heat = L.heatLayer(heatData, { radius: 35, blur: 20, maxZoom: 17, gradient: { 0.1: '#9ca3af', 0.3: '#16a34a', 0.5: '#f59e0b', 0.7: '#d97706', 0.9: '#ef4444', 1.0: '#dc2626' } });
      heat.addTo(map);
      layersRef.current.heat = heat;
    } else if (vistaActiva === 'zonas' && window.L.markerClusterGroup) {
      const clusterGroup = L.markerClusterGroup({
        iconCreateFunction: (cluster) => {
          const children = cluster.getAllChildMarkers();
          let maxPeso = 0;
          let maxNivel = 'no_evaluado';
          children.forEach(m => {
            const p = DANO_PESO[m.options.nivel] || 0;
            if (p > maxPeso) { maxPeso = p; maxNivel = m.options.nivel; }
          });
          const color = DANO_COLOR[maxNivel] || '#9ca3af';
          return L.divIcon({
            html: `<div style="background:${color};color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid rgba(255,255,255,0.6);box-shadow:0 2px 6px rgba(0,0,0,0.3)">${cluster.getChildCount()}</div>`,
            className: '', iconSize: [36, 36],
          });
        }
      });
      puntos.forEach(({ r, coords }) => {
        const color = DANO_COLOR[r.nivel_dano] || '#9ca3af';
        const marker = L.circleMarker(coords, {
          radius: 8, fillColor: color, color: '#fff',
          weight: 1.5, opacity: 1, fillOpacity: 0.9,
          nivel: r.nivel_dano,
        });
        marker.bindPopup(buildPopup(r, es));
        marker.on('click', () => setReporteSeleccionado(r));
        clusterGroup.addLayer(marker);
      });
      clusterGroup.addTo(map);
      layersRef.current.cluster = clusterGroup;
    } else if (vistaActiva === 'edificios') {
      const bounds = map.getBounds();
      const visibles = puntos.filter(({ coords }) =>
        coords[0] >= bounds.getSouth() && coords[0] <= bounds.getNorth() &&
        coords[1] >= bounds.getWest() && coords[1] <= bounds.getEast()
      ).slice(0, 150);

      const markersLayer = L.layerGroup();
      visibles.forEach(({ r, coords }) => {
        const color = DANO_COLOR[r.nivel_dano] || '#9ca3af';
        const atrapado = ATRAPADOS_ALERTA.includes(r.personas_atrapadas);
        const marker = L.circleMarker(coords, {
          radius: 9,
          fillColor: color,
          color: atrapado ? '#7c3aed' : '#fff',
          weight: atrapado ? 3 : 1.5,
          opacity: 1, fillOpacity: 0.95,
        });
        marker.bindPopup(buildPopup(r, es));
        marker.on('click', () => setReporteSeleccionado(r));
        markersLayer.addLayer(marker);
      });
      markersLayer.addTo(map);
      layersRef.current.markers = markersLayer;
    }
  }, [mapaListo, vistaActiva, reportesConCoords, es]);

  // Recargar edificios al mover mapa
  useEffect(() => {
    if (!mapaListo || !mapInstanceRef.current || vistaActiva !== 'edificios') return;
    const map = mapInstanceRef.current;
    const handler = () => {
      // Trigger re-render de capa
      if (layersRef.current.markers) {
        map.removeLayer(layersRef.current.markers);
        layersRef.current.markers = null;
      }
      // El siguiente useEffect lo reconstruirá
      setVistaActiva(v => v); // forzar re-render
    };
    map.on('moveend', handler);
    return () => map.off('moveend', handler);
  }, [mapaListo, vistaActiva]);

  const resetZoom = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setView([10.3, -66.9], 7);
  };

  const resumenEstados = calcResumenEstados(reportesFiltrados);
  const resumenCiudades = calcResumenCiudades(reportesFiltrados);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0D1117' }}>
      <TopBar />

      {/* ── HEADER ── */}
      <div style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', position: 'sticky', top: 54, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Título + contador */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: '#F0F6FC', margin: 0 }}>
              🗺️ {t('Mapa de Daños · CRIS Venezuela 2026', 'Damage Map · CRIS Venezuela 2026')}
            </h1>
            <span style={{ fontSize: 11, color: '#9BA5B0', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 20 }}>
              {cargando ? '...' : reportesConCoords.length} {t('reportes visibles', 'visible reports')}
            </span>
          </div>

          {/* Selector de vista */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'calor',     label: t('🔥 Calor', '🔥 Heat')         },
              { key: 'zonas',     label: t('🔵 Zonas', '🔵 Zones')        },
              { key: 'edificios', label: t('📍 Edificios', '📍 Buildings') },
            ].map(v => (
              <button key={v.key} onClick={() => {
                setVistaActiva(v.key);
                if (mapInstanceRef.current) {
                  const z = v.key === 'calor' ? 7 : v.key === 'zonas' ? 9 : 13;
                  mapInstanceRef.current.setZoom(z);
                }
              }} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: vistaActiva === v.key ? '#F0F6FC' : 'rgba(255,255,255,0.06)',
                color: vistaActiva === v.key ? '#0D1117' : '#9BA5B0',
                border: `1px solid ${vistaActiva === v.key ? '#F0F6FC' : 'rgba(255,255,255,0.1)'}`,
              }}>{v.label}</button>
            ))}
          </div>

          {/* Filtros de nivel + búsqueda */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {FILTROS.map(f => {
                const active = filtroNivel === f;
                const color = f === 'todos' ? '#9BA5B0' : DANO_COLOR[f];
                return (
                  <button key={f} onClick={() => setFiltroNivel(f)} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    background: active ? color : 'rgba(255,255,255,0.05)',
                    color: active ? '#fff' : (color || '#9BA5B0'),
                    border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                    textTransform: 'capitalize',
                  }}>
                    {f === 'todos' ? t('Todos', 'All') : (DANO_LABEL[f]?.[lang === 'es' ? 'es' : 'en'] || f)}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '4px 12px', flex: 1, minWidth: 140, maxWidth: 260 }}>
              <Search size={12} color="#9BA5B0" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder={t('Ciudad o dirección...', 'City or address...')}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: '#F0F6FC', width: '100%' }} />
              {busqueda && <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9BA5B0', padding: 0 }}><X size={10} /></button>}
            </div>
          </div>
        </div>
      </div>

      {/* ── CUERPO: Panel + Mapa ── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 'calc(100vh - 180px)' }}>

        {/* ── PANEL LATERAL ── */}
        <div style={{
          width: panelAbierto ? 220 : 0,
          minWidth: panelAbierto ? 220 : 0,
          overflow: 'hidden',
          background: '#111318',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          transition: 'width 200ms ease',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 180px)',
          position: 'sticky', top: 180,
          flexShrink: 0,
        }}>
          {panelAbierto && (
            <div style={{ padding: 12, minWidth: 220 }}>
              {/* Vista Calor → por estado */}
              {vistaActiva === 'calor' && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 8 }}>
                    {t('Por estado / región', 'By state / region')}
                  </p>
                  {resumenEstados.slice(0, 15).map(([estado, data]) => {
                    const maxNivel = ['colapsado','critico','grave','moderado','leve'].find(n => data[n] > 0) || 'no_evaluado';
                    const color = DANO_COLOR[maxNivel];
                    const pct = Math.round((data.total / Math.max(1, resumenEstados[0][1].total)) * 100);
                    return (
                      <div key={estado} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 10, color: '#C0C8D2', fontWeight: 500 }}>{estado}</span>
                          <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{data.total}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Vista Zonas → ranking ciudades */}
              {vistaActiva === 'zonas' && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 8 }}>
                    {t('Ciudades afectadas', 'Affected cities')}
                  </p>
                  {resumenCiudades.slice(0, 20).map(([ciudad, data]) => {
                    const color = DANO_COLOR[data.maxDano] || '#9ca3af';
                    return (
                      <button key={ciudad} onClick={() => {
                        if (mapInstanceRef.current && data.lat) {
                          mapInstanceRef.current.setView([data.lat, data.lng], 12);
                        }
                      }} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', background: 'transparent', border: 'none',
                        padding: '5px 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#C0C8D2', textAlign: 'left' }}>{ciudad}</span>
                        </div>
                        <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{data.total}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Vista Edificios → ficha seleccionada */}
              {vistaActiva === 'edificios' && (
                <>
                  {reporteSeleccionado ? (
                    <>
                      <button onClick={() => setReporteSeleccionado(null)} style={{ background: 'none', border: 'none', color: '#9BA5B0', fontSize: 10, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ← {t('Todos', 'All')}
                      </button>
                      {reporteSeleccionado.foto_urls?.[0] && (
                        <img src={reporteSeleccionado.foto_urls[0]} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                      )}
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', marginBottom: 4 }}>
                        {reporteSeleccionado.nombre_lugar || reporteSeleccionado.tipo_estructura?.replace(/_/g, ' ') || '—'}
                      </p>
                      <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: DANO_COLOR[reporteSeleccionado.nivel_dano] || '#9ca3af', color: '#fff', marginBottom: 6 }}>
                        {DANO_LABEL[reporteSeleccionado.nivel_dano]?.[es ? 'es' : 'en'] || reporteSeleccionado.nivel_dano}
                      </span>
                      {ATRAPADOS_ALERTA.includes(reporteSeleccionado.personas_atrapadas) && (
                        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#7c3aed', color: '#fff', marginBottom: 6, marginLeft: 4 }}>
                          🆘 {t('Atrapados', 'Trapped')}
                        </span>
                      )}
                      <p style={{ fontSize: 11, color: '#9BA5B0', marginBottom: 2 }}>📍 {reporteSeleccionado.ciudad}, {reporteSeleccionado.estado_region}</p>
                      {reporteSeleccionado.direccion && <p style={{ fontSize: 10, color: '#9BA5B0' }}>{reporteSeleccionado.direccion}</p>}
                      <Link to={`/edificio?id=${reporteSeleccionado.id}`} style={{ display: 'block', marginTop: 10, fontSize: 11, color: '#4A9EDB', textDecoration: 'none', textAlign: 'center', background: 'rgba(74,158,219,0.1)', borderRadius: 8, padding: '6px 0', border: '1px solid rgba(74,158,219,0.2)' }}>
                        {t('Ver ficha completa →', 'Full details →')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 8 }}>
                        {t('Edificios en vista', 'Buildings in view')}
                      </p>
                      <p style={{ fontSize: 11, color: '#9BA5B0' }}>
                        {t('Haz clic en un marcador del mapa para ver la ficha.', 'Click a marker on the map to see details.')}
                      </p>
                      <div style={{ marginTop: 8 }}>
                        {reportesConCoords.slice(0, 8).map(r => (
                          <button key={r.id} onClick={() => setReporteSeleccionado(r)} style={{
                            display: 'flex', width: '100%', background: 'none', border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '6px 0', cursor: 'pointer', gap: 6, alignItems: 'center',
                          }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: DANO_COLOR[r.nivel_dano] || '#9ca3af', flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: '#C0C8D2', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.nombre_lugar || r.ciudad || '—'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Toggle panel en mobile */}
        <button onClick={() => setPanelAbierto(v => !v)} style={{
          position: 'absolute', left: panelAbierto ? 220 : 0, top: 12, zIndex: 20,
          background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none',
          color: '#9BA5B0', padding: '6px 4px', cursor: 'pointer', borderRadius: '0 6px 6px 0',
          transition: 'left 200ms ease',
        }}>
          <ChevronRight size={12} style={{ transform: panelAbierto ? 'rotate(180deg)' : 'none' }} />
        </button>

        {/* ── CONTENEDOR DEL MAPA ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!mapaIniciar && lowBw ? (
            // Modo bajo consumo → vista lista
            <div style={{ padding: 20 }}>
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: 0 }}>{t('Modo bajo consumo activo', 'Low-bandwidth mode active')}</p>
                  <p style={{ fontSize: 11, color: '#9BA5B0', margin: 0 }}>{t('El mapa está desactivado para ahorrar datos.', 'Map is disabled to save data.')}</p>
                </div>
              </div>
              <button onClick={() => setMapaIniciar(true)} style={{ background: '#2471A3', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
                🗺️ {t('Cargar mapa de todas formas', 'Load map anyway')}
              </button>
              {/* Lista de reportes en modo texto */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                {reportesFiltrados.slice(0, 30).map(r => (
                  <Link key={r.id} to={`/edificio?id=${r.id}`} style={{ textDecoration: 'none', display: 'block', background: '#161B22', border: `1px solid ${DANO_COLOR[r.nivel_dano] || '#9ca3af'}40`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: DANO_COLOR[r.nivel_dano] || '#9ca3af', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F0F6FC' }}>{r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || '—'}</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#9BA5B0', margin: 0 }}>📍 {[r.direccion, r.ciudad].filter(Boolean).join(' · ')}</p>
                    {ATRAPADOS_ALERTA.includes(r.personas_atrapadas) && (
                      <span style={{ fontSize: 9, background: '#7c3aed', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>🆘 {t('Atrapados', 'Trapped')}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Mapa */}
              <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 220px)' }} />

              {/* Spinner mientras carga */}
              {!mapaListo && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1117' }}>
                  <div style={{ textAlign: 'center', color: '#9BA5B0' }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12 }}>{t('Cargando mapa...', 'Loading map...')}</p>
                  </div>
                </div>
              )}

              {/* Botón reset zoom */}
              {mapaListo && (
                <button onClick={resetZoom} style={{
                  position: 'absolute', bottom: 80, right: 12, zIndex: 10,
                  background: '#161B22', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#C0C8D2', fontSize: 11, fontWeight: 600, padding: '7px 12px',
                  borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}>
                  <RotateCcw size={12} /> {t('Venezuela completa', 'Full Venezuela')}
                </button>
              )}

              {/* ── LEYENDA ── */}
              {mapaListo && (
                <div style={{
                  position: 'absolute', bottom: 12, right: 12, zIndex: 10,
                  background: 'rgba(13,17,23,0.92)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 12px', minWidth: 130,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
                    {t('Nivel de daño', 'Damage level')}
                  </p>
                  {Object.entries(DANO_LABEL).map(([key, label]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: DANO_COLOR[key], flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: '#C0C8D2' }}>{label[es ? 'es' : 'en']}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid #7c3aed', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#C0C8D2' }}>{t('Atrapados', 'Trapped')}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {cargando && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 50 }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: '#4A9EDB' }} />
          <span style={{ fontSize: 11, color: '#9BA5B0' }}>{t('Cargando reportes...', 'Loading reports...')}</span>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </div>
  );
}

// ── Helper: construir popup de Leaflet ──
function buildPopup(r, es) {
  const color = DANO_COLOR[r.nivel_dano] || '#9ca3af';
  const atrapado = ATRAPADOS_ALERTA.includes(r.personas_atrapadas);
  const label = DANO_LABEL[r.nivel_dano]?.[es ? 'es' : 'en'] || r.nivel_dano;
  const foto = r.foto_urls?.[0] ? `<img src="${r.foto_urls[0]}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px" />` : '';
  return `<div style="min-width:160px;max-width:200px;font-family:system-ui,sans-serif">
    ${foto}
    <p style="font-size:12px;font-weight:700;color:#1a1a1a;margin:0 0 4px">${r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || '—'}</p>
    <span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${color};color:#fff;margin-bottom:4px">${label}</span>
    ${atrapado ? `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#7c3aed;color:#fff;margin-left:4px">${es ? '🆘 Atrapados' : '🆘 Trapped'}</span>` : ''}
    <p style="font-size:10px;color:#666;margin:4px 0 0">📍 ${r.ciudad || ''}, ${r.estado_region || ''}</p>
    <a href="/edificio?id=${r.id}" style="display:block;margin-top:6px;font-size:10px;color:#2471A3;text-align:center;text-decoration:none;background:#f0f7ff;border-radius:6px;padding:4px 0;border:1px solid #bee3f8">
      ${es ? 'Ver ficha →' : 'View details →'}
    </a>
  </div>`;
}
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, X, RotateCcw, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

// ── Config ─────────────────────────────────────────────
const DANO_COLOR = {
  colapsado: '#dc2626', critico: '#ef4444', grave: '#d97706',
  moderado: '#f59e0b', leve: '#16a34a', no_evaluado: '#6B7280',
};
const DANO_LABEL = {
  colapsado: { es: 'Colapsado', en: 'Collapsed' },
  critico: { es: 'Crítico', en: 'Critical' },
  grave: { es: 'Grave', en: 'Severe' },
  moderado: { es: 'Moderado', en: 'Moderate' },
  leve: { es: 'Leve', en: 'Minor' },
  no_evaluado: { es: 'Sin evaluar', en: 'Not evaluated' },
};
const DANO_PESO = { colapsado: 1.0, critico: 0.8, grave: 0.6, moderado: 0.4, leve: 0.2, no_evaluado: 0.1 };
const ATRAPADOS_ALERTA = ['si', 'voces', 'posible'];

const TIPO_ICONO = {
  edificio_residencial: '🏠', hospital: '🏥', escuela: '🏫',
  iglesia: '⛪', comercio: '🏪', calle_via: '🛣️', puente: '🌉',
  servicio_publico: '🔌', refugio: '🏕️', otro: '🏗️',
};

// ── Filtros paralelos ──
const FILTROS_DANO = ['todos', 'colapsado', 'critico', 'grave', 'moderado', 'leve', 'no_evaluado'];
const CAPAS_SERVICIO = [
  { key: 'dano',       icon: '🏚️', es: 'Daños',            en: 'Damage' },
  { key: 'acceso',     icon: '🚧', es: 'Acceso vial',       en: 'Road access' },
  { key: 'electricidad', icon: '💡', es: 'Electricidad',    en: 'Electricity' },
  { key: 'agua',       icon: '🚰', es: 'Agua',              en: 'Water' },
  { key: 'gas',        icon: '🔥', es: 'Gas / Riesgos',     en: 'Gas / Hazards' },
  { key: 'sin_novedad', icon: '✅', es: 'Sin novedades',     en: 'All clear' },
];

const SERVICIO_COLOR = {
  disponible: { color: '#16a34a', peso: 0.2 },
  intermitente: { color: '#d97706', peso: 0.5 },
  no_disponible: { color: '#dc2626', peso: 0.8 },
  suspendido: { color: '#dc2626', peso: 0.8 },
  fuga_reportada: { color: '#7c3aed', peso: 1.0 },
  normal: { color: '#16a34a', peso: 0.2 },
  dificultad: { color: '#f59e0b', peso: 0.5 },
  solo_peatonal: { color: '#d97706', peso: 0.6 },
  bloqueada: { color: '#dc2626', peso: 0.9 },
  insegura: { color: '#7c3aed', peso: 0.8 },
  no_confirmado: { color: '#6B7280', peso: 0.1 },
  no_disponible_acceso: { color: '#dc2626', peso: 0.8 },
};

// ── Coordenadas de ciudades (fallback) ──
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

function getCoords(r) {
  if (r.lat && r.lng) return [r.lat, r.lng];
  const c = (r.ciudad || '').toLowerCase().trim();
  return CIUDAD_COORDS[c] || null;
}

// ── Helper: color de un servicio ──
function servicioColor(key, val) {
  if (key === 'acceso') return SERVICIO_COLOR[val]?.color || '#6B7280';
  if (key === 'electricidad' || key === 'agua') return SERVICIO_COLOR[val]?.color || '#6B7280';
  if (key === 'gas') return SERVICIO_COLOR[val]?.color || '#6B7280';
  return '#6B7280';
}
function servicioPeso(key, val) {
  if (key === 'acceso') return SERVICIO_COLOR[val]?.peso || 0;
  if (key === 'electricidad' || key === 'agua') return SERVICIO_COLOR[val]?.peso || 0;
  if (key === 'gas') return SERVICIO_COLOR[val]?.peso || 0;
  return 0;
}
function accesoVal(estado) {
  if (!estado) return 'no_confirmado';
  if (estado.acceso_calle !== 'no_confirmado') return estado.acceso_calle;
  if (estado.acceso_vehiculos !== 'no_confirmado') return estado.acceso_vehiculos;
  return 'no_confirmado';
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

export default function MapaDanos() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const t = (e, n) => es ? e : n;

  const [reportes, setReportes] = useState([]);
  const [estadosOp, setEstadosOp] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [capaActiva, setCapaActiva] = useState('dano');
  const [filtroDano, setFiltroDano] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [mapaListo, setMapaListo] = useState(false);
  const [mapaIniciar, setMapaIniciar] = useState(!lowBw);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});
  const estadoOpIndexRef = useRef({});

  // ── Cargar datos ──
  useEffect(() => {
    Promise.all([
      base44.entities.ReportesDano.list('-updated_date', 500),
      base44.entities.EstadoOperativoEdificio.list('-updated_date', 500),
    ])
      .then(([d, eo]) => {
        setReportes(d || []);
        setEstadosOp(eo || []);
        // índice rápido: edificio_id → estado operativo
        const idx = {};
        (eo || []).forEach(e => {
          if (!idx[e.edificio_id]) idx[e.edificio_id] = e;
        });
        estadoOpIndexRef.current = idx;
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  // ── Filtros paralelos ──
  // Filtro 1: búsqueda textual
  const reportesFiltrados = reportes.filter(r => {
    const q = busqueda.toLowerCase().trim();
    return !q || (r.ciudad || '').toLowerCase().includes(q)
      || (r.nombre_lugar || '').toLowerCase().includes(q)
      || (r.direccion || '').toLowerCase().includes(q)
      || (r.estado_region || '').toLowerCase().includes(q);
  });
  // Filtro 2: categoría de daño (paralelo, no cambia el mapa base)
  const reportesPorDano = reportesFiltrados.filter(r =>
    filtroDano === 'todos' || r.nivel_dano === filtroDano
  );
  // Base: siempre los que tienen coordenadas
  const reportesConCoords = reportesPorDano.filter(r => getCoords(r));

  // ── Capa de servicio: solo cambia color/popup, no oculta edificios ──
  const reportesCapa = useCallback(() => {
    return reportesConCoords;
  }, [reportesConCoords]);

  // ── Obtener color/peso según capa para un reporte ──
  function getCapaData(r) {
    const eo = estadoOpIndexRef.current[r.id];
    if (capaActiva === 'dano') return { color: DANO_COLOR[r.nivel_dano] || '#6B7280', peso: DANO_PESO[r.nivel_dano] || 0.1 };
    if (capaActiva === 'acceso') {
      const val = accesoVal(eo || {});
      return { color: servicioColor('acceso', val), peso: servicioPeso('acceso', val) };
    }
    if (capaActiva === 'electricidad') {
      const val = eo?.electricidad || 'no_confirmado';
      return { color: servicioColor('electricidad', val), peso: servicioPeso('electricidad', val) };
    }
    if (capaActiva === 'agua') {
      const val = eo?.agua || 'no_confirmado';
      return { color: servicioColor('agua', val), peso: servicioPeso('agua', val) };
    }
    if (capaActiva === 'gas') {
      const val = eo?.gas || 'no_confirmado';
      return { color: servicioColor('gas', val), peso: servicioPeso('gas', val) };
    }
    if (capaActiva === 'sin_novedad') return { color: '#16a34a', peso: 0.2 };
    return { color: '#6B7280', peso: 0.1 };
  }

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
    map.on('zoomend', () => {});
    setMapaListo(true);
  }, [cargarScripts]);

  useEffect(() => {
    if (mapaIniciar && !lowBw) inicializarMapa();
  }, [mapaIniciar, lowBw, inicializarMapa]);

  // ── Renderizar mapa base (siempre edificios, capa solo cambia color/popup) ──
  useEffect(() => {
    if (!mapaListo || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Limpiar
    Object.values(layersRef.current).forEach(l => { try { map.removeLayer(l); } catch {} });
    layersRef.current = {};

    const datos = reportesCapa();
    const zoom = map.getZoom();

    // Heatmap (zoom bajo, solo cuando la capa no es sin_novedad)
    if (zoom < 8 && window.L.heatLayer && capaActiva !== 'sin_novedad') {
      const heatData = datos.map(r => {
        const { peso } = getCapaData(r);
        const c = getCoords(r);
        return c ? [...c, peso] : null;
      }).filter(Boolean);
      if (heatData.length > 0) {
        const heat = L.heatLayer(heatData, {
          radius: 30, blur: 18, maxZoom: 17,
          gradient: { 0.1: '#6B7280', 0.3: '#16a34a', 0.5: '#f59e0b', 0.7: '#d97706', 0.9: '#ef4444', 1.0: '#dc2626' },
        });
        heat.addTo(map);
        layersRef.current.heat = heat;
      }
    }

    // Siempre: clusters o marcadores según zoom
    if (zoom <= 12 && window.L.markerClusterGroup) {
      const clusterGroup = L.markerClusterGroup({
        iconCreateFunction: (cluster) => {
          const children = cluster.getAllChildMarkers();
          let maxPeso = 0;
          let maxColor = '#6B7280';
          children.forEach(m => { if ((m.options._peso || 0) > maxPeso) { maxPeso = m.options._peso; maxColor = m.options._color || '#6B7280'; } });
          return L.divIcon({
            html: `<div style="background:${maxColor};color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid rgba(255,255,255,0.6);box-shadow:0 2px 6px rgba(0,0,0,0.3)">${cluster.getChildCount()}</div>`,
            className: '', iconSize: [36, 36],
          });
        },
      });
      datos.forEach(r => {
        const c = getCoords(r);
        if (!c) return;
        const { color, peso } = getCapaData(r);
        const marker = L.circleMarker(c, {
          radius: 8, fillColor: color, color: '#fff',
          weight: 1.5, opacity: 1, fillOpacity: 0.9,
          _peso: peso, _color: color,
        });
        marker.bindPopup(buildPopup(r, es, capaActiva, estadoOpIndexRef.current[r.id]));
        marker.on('click', () => setReporteSeleccionado(r));
        clusterGroup.addLayer(marker);
      });
      clusterGroup.addTo(map);
      layersRef.current.cluster = clusterGroup;
    }

    // Marcadores individuales (zoom alto)
    if (zoom > 12) {
      const markers = L.layerGroup();
      const bounds = map.getBounds();
      const visibles = datos.filter(r => {
        const c = getCoords(r);
        return c && c[0] >= bounds.getSouth() && c[0] <= bounds.getNorth() &&
          c[1] >= bounds.getWest() && c[1] <= bounds.getEast();
      }).slice(0, 200);

      visibles.forEach(r => {
        const c = getCoords(r);
        if (!c) return;
        const { color } = getCapaData(r);
        const icono = TIPO_ICONO[r.tipo_estructura] || '🏗️';
        const atrapado = ATRAPADOS_ALERTA.includes(r.personas_atrapadas);

        const marker = L.marker(c, {
          icon: L.divIcon({
            html: `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
              <span style="font-size:16px;line-height:1">${icono}</span>
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};border:1.5px solid ${atrapado ? '#7c3aed' : 'rgba(255,255,255,0.7)'}"></span>
            </div>`,
            className: '', iconSize: [24, 28], iconAnchor: [12, 28],
          }),
        });
        marker.bindPopup(buildPopup(r, es, capaActiva, estadoOpIndexRef.current[r.id]));
        marker.on('click', () => setReporteSeleccionado(r));
        markers.addLayer(marker);
      });
      markers.addTo(map);
      layersRef.current.markers = markers;
    }
  }, [mapaListo, capaActiva, reportesCapa, es]);

  const resetZoom = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setView([10.3, -66.9], 7);
  };

  const resumenEstados = calcResumenEstados(reportesFiltrados);

  // ── Contador de la capa activa ──
  const datosCapa = reportesCapa();
  const totalCapa = datosCapa.length;

  // ── Leyenda dinámica ──
  function renderLeyenda() {
    if (capaActiva === 'dano') {
      return (
        <>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>{t('Nivel de daño', 'Damage level')}</p>
          {Object.entries(DANO_LABEL).map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: DANO_COLOR[k], flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#C0C8D2' }}>{l[es ? 'es' : 'en']}</span>
            </div>
          ))}
        </>
      );
    }
    if (capaActiva === 'acceso') {
      const items = [
        { v: 'normal', es: 'Normal', en: 'Normal' },
        { v: 'dificultad', es: 'Dificultad', en: 'Difficulty' },
        { v: 'solo_peatonal', es: 'Solo peatonal', en: 'Pedestrian only' },
        { v: 'bloqueada', es: 'Bloqueada', en: 'Blocked' },
        { v: 'insegura', es: 'Insegura', en: 'Unsafe' },
      ];
      return (
        <>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 6 }}>{t('Acceso vial', 'Road access')}</p>
          {items.map(i => (
            <div key={i.v} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SERVICIO_COLOR[i.v]?.color || '#6B7280', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#C0C8D2' }}>{es ? i.es : i.en}</span>
            </div>
          ))}
        </>
      );
    }
    if (capaActiva === 'electricidad' || capaActiva === 'agua') {
      const title = capaActiva === 'electricidad' ? t('Electricidad', 'Electricity') : t('Agua', 'Water');
      const items = [
        { v: 'disponible', es: 'Disponible', en: 'Available' },
        { v: 'intermitente', es: 'Intermitente', en: 'Intermittent' },
        { v: 'no_disponible', es: 'No disponible', en: 'Not available' },
      ];
      return (
        <>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 6 }}>{title}</p>
          {items.map(i => (
            <div key={i.v} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SERVICIO_COLOR[i.v]?.color || '#6B7280', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#C0C8D2' }}>{es ? i.es : i.en}</span>
            </div>
          ))}
        </>
      );
    }
    if (capaActiva === 'gas') {
      return (
        <>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 6 }}>{t('Gas / Riesgos', 'Gas / Hazards')}</p>
          {[
            { v: 'disponible', es: 'Disponible', en: 'Available' },
            { v: 'suspendido', es: 'Suspendido', en: 'Suspended' },
            { v: 'fuga_reportada', es: '⚠️ Fuga reportada', en: '⚠️ Leak reported' },
          ].map(i => (
            <div key={i.v} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SERVICIO_COLOR[i.v]?.color || '#6B7280', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#C0C8D2' }}>{es ? i.es : i.en}</span>
            </div>
          ))}
        </>
      );
    }
    if (capaActiva === 'sin_novedad') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#C0C8D2' }}>{t('Sin novedades', 'All clear')}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0D1117' }}>
      <TopBar />

      {/* ── HEADER ── */}
      <div style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', position: 'sticky', top: 54, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Título */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: '#F0F6FC', margin: 0 }}>
              🗺️ {t('Mapa de Daños · Status Vzla', 'Damage Map · Status Vzla')}
            </h1>
            <span style={{ fontSize: 11, color: '#9BA5B0', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 20 }}>
              {cargando ? '...' : reportesConCoords.length} {t('edificios en mapa', 'buildings on map')}
            </span>
          </div>

          {/* ── Filtro paralelo 1: categoría de daño (no modifica el mapa base) ── */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
            {FILTROS_DANO.map(f => {
              const active = filtroDano === f;
              const color = f === 'todos' ? '#9BA5B0' : DANO_COLOR[f];
              return (
                <button key={f} onClick={() => setFiltroDano(f)} style={{
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

          {/* ── Filtro paralelo 2: capa de servicio (solo cambia color/popup) ── */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {CAPAS_SERVICIO.map(c => {
              const active = capaActiva === c.key;
              return (
                <button key={c.key} onClick={() => setCapaActiva(c.key)}
                  style={{
                    padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: active ? '#2471A3' : 'rgba(255,255,255,0.06)',
                    color: active ? '#fff' : '#9BA5B0',
                    border: `1px solid ${active ? '#2471A3' : 'rgba(255,255,255,0.1)'}`,
                    whiteSpace: 'nowrap',
                  }}>
                  {c.icon} {es ? c.es : c.en}
                </button>
              );
            })}
          </div>

          {/* Búsqueda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '4px 12px', maxWidth: 300 }}>
            <Search size={12} color="#9BA5B0" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder={t('Ciudad o dirección...', 'City or address...')}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: '#F0F6FC', width: '100%' }} />
            {busqueda && <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9BA5B0', padding: 0 }}><X size={10} /></button>}
          </div>
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 'calc(100vh - 180px)' }}>

        {/* ── PANEL LATERAL ── */}
        <div style={{
          width: panelAbierto ? 240 : 0,
          minWidth: panelAbierto ? 240 : 0,
          overflow: 'hidden',
          background: '#111318',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          transition: 'width 200ms ease',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 180px)',
          position: 'sticky', top: 180, flexShrink: 0,
        }}>
          {panelAbierto && (
            <div style={{ padding: 12, minWidth: 240 }}>
              {/* Resumen por estado */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9BA5B0', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                {t('Por estado / región', 'By state / region')}
              </p>
              {resumenEstados.slice(0, 18).map(([estado, data]) => {
                const maxNivel = ['colapsado','critico','grave','moderado','leve'].find(n => data[n] > 0) || 'no_evaluado';
                const color = DANO_COLOR[maxNivel];
                const pct = Math.round((data.total / Math.max(1, resumenEstados[0][1].total)) * 100);
                return (
                  <div key={estado} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: '#C0C8D2', fontWeight: 500 }}>{estado}</span>
                      <span style={{ fontSize: 10, color, fontWeight: 700 }}>{data.total}</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}

              {/* Ficha seleccionada */}
              {reporteSeleccionado && (
                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                  <button onClick={() => setReporteSeleccionado(null)} style={{
                    background: 'none', border: 'none', color: '#9BA5B0', fontSize: 10, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← {t('Cerrar ficha', 'Close')}
                  </button>
                  {reporteSeleccionado.foto_urls?.[0] && (
                    <img src={reporteSeleccionado.foto_urls[0]} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{TIPO_ICONO[reporteSeleccionado.tipo_estructura] || '🏗️'}</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>
                      {reporteSeleccionado.nombre_lugar || reporteSeleccionado.tipo_estructura?.replace(/_/g, ' ') || '—'}
                    </p>
                  </div>
                  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: DANO_COLOR[reporteSeleccionado.nivel_dano] || '#6B7280', color: '#fff', marginBottom: 4 }}>
                    {DANO_LABEL[reporteSeleccionado.nivel_dano]?.[es ? 'es' : 'en'] || reporteSeleccionado.nivel_dano}
                  </span>
                  {ATRAPADOS_ALERTA.includes(reporteSeleccionado.personas_atrapadas) && (
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#7c3aed', color: '#fff', marginBottom: 4, marginLeft: 4 }}>
                      🆘 {t('Atrapados', 'Trapped')}
                    </span>
                  )}
                  <p style={{ fontSize: 11, color: '#9BA5B0', marginBottom: 2 }}>📍 {reporteSeleccionado.ciudad}, {reporteSeleccionado.estado_region}</p>
                  {reporteSeleccionado.direccion && <p style={{ fontSize: 10, color: '#9BA5B0' }}>{reporteSeleccionado.direccion}</p>}
                  <Link to={`/edificio?id=${reporteSeleccionado.id}`} style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#4A9EDB', textDecoration: 'none', textAlign: 'center', background: 'rgba(74,158,219,0.1)', borderRadius: 8, padding: '6px 0', border: '1px solid rgba(74,158,219,0.2)' }}>
                    {t('Ver ficha completa →', 'Full details →')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toggle panel */}
        <button onClick={() => setPanelAbierto(v => !v)} style={{
          position: 'absolute', left: panelAbierto ? 240 : 0, top: 12, zIndex: 20,
          background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none',
          color: '#9BA5B0', padding: '6px 4px', cursor: 'pointer', borderRadius: '0 6px 6px 0',
          transition: 'left 200ms ease',
        }}>
          <ChevronRight size={12} style={{ transform: panelAbierto ? 'rotate(180deg)' : 'none' }} />
        </button>

        {/* ── MAPA ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!mapaIniciar && lowBw ? (
            // ── Modo bajo consumo ──
            <div style={{ padding: 20 }}>
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: 0 }}>{t('Modo bajo consumo activo', 'Low-bandwidth mode active')}</p>
                  <p style={{ fontSize: 11, color: '#9BA5B0', margin: 0 }}>{t('Mapa desactivado para ahorrar datos.', 'Map is disabled to save data.')}</p>
                </div>
              </div>
              <button onClick={() => setMapaIniciar(true)} style={{ background: '#2471A3', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
                🗺️ {t('Cargar mapa', 'Load map')}
              </button>
              {/* Lista texto */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                {reportesFiltrados.slice(0, 30).map(r => (
                  <Link key={r.id} to={`/edificio?id=${r.id}`} style={{ textDecoration: 'none', display: 'block', background: '#161B22', border: `1px solid ${DANO_COLOR[r.nivel_dano] || '#6B7280'}40`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{TIPO_ICONO[r.tipo_estructura] || '🏗️'}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F0F6FC' }}>{r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || '—'}</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#9BA5B0', margin: 0 }}>📍 {[r.ciudad, r.estado_region].filter(Boolean).join(', ')}</p>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, fontWeight: 700, background: `${DANO_COLOR[r.nivel_dano]}30`, color: DANO_COLOR[r.nivel_dano] || '#6B7280' }}>
                        {DANO_LABEL[r.nivel_dano]?.[es ? 'es' : 'en'] || r.nivel_dano}
                      </span>
                      {ATRAPADOS_ALERTA.includes(r.personas_atrapadas) && (
                        <span style={{ fontSize: 9, background: '#7c3aed', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>🆘 {t('Atrapados', 'Trapped')}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 220px)' }} />
              {!mapaListo && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1117' }}>
                  <div style={{ textAlign: 'center', color: '#9BA5B0' }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12 }}>{t('Cargando mapa...', 'Loading map...')}</p>
                  </div>
                </div>
              )}
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
              {mapaListo && (
                <div style={{
                  position: 'absolute', bottom: 12, right: 12, zIndex: 10,
                  background: 'rgba(13,17,23,0.92)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 12px', minWidth: 130,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}>
                  {renderLeyenda()}
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

// ── Popup ──
function buildPopup(r, es, capa, eo) {
  const color = DANO_COLOR[r.nivel_dano] || '#6B7280';
  const atrapado = ATRAPADOS_ALERTA.includes(r.personas_atrapadas);
  const label = DANO_LABEL[r.nivel_dano]?.[es ? 'es' : 'en'] || r.nivel_dano;
  const icono = TIPO_ICONO[r.tipo_estructura] || '🏗️';
  const foto = r.foto_urls?.[0] ? `<img src="${r.foto_urls[0]}" style="width:100%;height:70px;object-fit:cover;border-radius:6px;margin-bottom:6px" />` : '';

  let extras = '';
  if (eo && capa !== 'dano') {
    const acc = [];
    if (capa === 'acceso') acc.push(`🚧 ${es ? 'Acceso' : 'Access'}: ${eo.acceso_calle || '?'}`);
    if (capa === 'electricidad') acc.push(`💡 ${es ? 'Luz' : 'Power'}: ${eo.electricidad || '?'}`);
    if (capa === 'agua') acc.push(`🚰 ${es ? 'Agua' : 'Water'}: ${eo.agua || '?'}`);
    if (capa === 'gas') acc.push(`🔥 ${es ? 'Gas' : 'Gas'}: ${eo.gas || '?'}`);
    if (capa === 'sin_novedad') acc.push(`✅ ${es ? 'Sin novedades' : 'All clear'}`);
    if (acc.length) extras = `<p style="font-size:10px;color:#555;margin:4px 0">${acc.join(' · ')}</p>`;
  }

  return `<div style="min-width:160px;max-width:200px;font-family:system-ui,sans-serif">
    ${foto}
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
      <span style="font-size:14px">${icono}</span>
      <p style="font-size:12px;font-weight:700;color:#1a1a1a;margin:0">${r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || '—'}</p>
    </div>
    <span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${color};color:#fff;margin-bottom:4px">${label}</span>
    ${atrapado ? `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#7c3aed;color:#fff;margin-left:4px">${es ? '🆘 Atrapados' : '🆘 Trapped'}</span>` : ''}
    ${extras}
    <p style="font-size:10px;color:#666;margin:4px 0 0">📍 ${r.ciudad || ''}, ${r.estado_region || ''}</p>
    <a href="/edificio?id=${r.id}" style="display:block;margin-top:6px;font-size:10px;color:#2471A3;text-align:center;text-decoration:none;background:#f0f7ff;border-radius:6px;padding:4px 0;border:1px solid #bee3f8">
      ${es ? 'Ver ficha →' : 'View details →'}
    </a>
  </div>`;
}
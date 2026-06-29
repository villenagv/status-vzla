import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Copy, Check, Globe, Database, Mail, Code, MousePointerClick, Map } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

// ── Snippets de código ────────────────────────────────────────────────────────

const SNIPPET_MAPA_JS = `<!-- Widget Mapa — StatusVzla.com (Leaflet + API pública) -->
<div id="svzla-mapa" style="font-family:sans-serif;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;max-width:100%;">
  <div id="svzla-map" style="height:400px;background:#f3f4f6;"></div>
  <div style="padding:8px 14px;background:#0D1117;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:11px;color:#9BA5B0;">Datos: StatusVzla.com API</span>
    <a href="https://statusvzla.com" target="_blank" style="font-size:10px;font-weight:800;color:#F5C518;text-decoration:none;">Powered by StatusVzla.com ↗</a>
  </div>
</div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script>
fetch('https://statusvzla.com/functions/apiMapa?format=geojson')
  .then(r => r.json())
  .then(data => {
    var map = L.map('svzla-map').setView([10.48, -66.90], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    var colores = {leve:'#D97706',moderado:'#EA580C',grave:'#DC2626',critico:'#991B1B',colapsado:'#450A0A',no_evaluado:'#6B7280'};
    L.geoJSON(data, {
      pointToLayer: function(f,latlng) {
        var c = colores[f.properties.nivel_dano] || '#6B7280';
        return L.circleMarker(latlng,{radius:7,fillColor:c,color:'#fff',weight:1,fillOpacity:0.9});
      },
      onEachFeature: function(f,layer) {
        var p = f.properties;
        layer.bindPopup('<b>'+(p.nombre||'Sin nombre')+'<\/b><br>Daño: '+p.nivel_dano+'<br><a href="'+p.url+'" target="_blank">Ver detalle ↗<\/a>');
      }
    }).addTo(map);
  });
<\/script>`;

const SNIPPET_BTN_SCRIPT = `<script src="https://statusvzla.com/widget-reportar.js"><\/script>`;

const SNIPPET_BTN_HTML = `<!-- Botón de reporte — StatusVzla.com -->
<a href="https://statusvzla.com/reportar-dano"
   target="_blank" rel="noopener noreferrer"
   style="display:inline-flex;align-items:center;gap:7px;
          background:#C0392B;color:#fff;padding:13px 20px;
          border-radius:999px;text-decoration:none;font-weight:700;
          font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,0.3);">
  📍 Reportar edificio dañado
</a>
<!-- Powered by StatusVzla.com -->`;

const API_BASE = 'https://statusvzla.com/functions/apiMapa';
const ENDPOINTS = [
  { key: 'json',    url: `${API_BASE}`,                               desc: { es: 'Edificios + refugios (JSON completo)',          en: 'Buildings + shelters (full JSON)' } },
  { key: 'geojson', url: `${API_BASE}?format=geojson`,                desc: { es: 'Formato GeoJSON — Leaflet, QGIS, Mapbox',       en: 'GeoJSON format — Leaflet, QGIS, Mapbox' } },
  { key: 'list',    url: `${API_BASE}?format=list`,                   desc: { es: 'Lista plana (nombre, ciudad, nivel de daño)',   en: 'Flat list (name, city, damage level)' } },
  { key: 'ciudad',  url: `${API_BASE}?format=list&ciudad=Caracas`,    desc: { es: 'Filtrar por ciudad',                           en: 'Filter by city' } },
  { key: 'nivel',   url: `${API_BASE}?format=list&nivel=grave`,       desc: { es: 'Filtrar por nivel de daño',                   en: 'Filter by damage level' } },
  { key: 'tipo',    url: `${API_BASE}?format=list&tipo=hospital`,     desc: { es: 'Filtrar por tipo de estructura',              en: 'Filter by structure type' } },
];

// ── Componente copiable ───────────────────────────────────────────────────────
function CodeBlock({ code, label, labelOk }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        background: '#0D1117', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10,
        padding: '14px 16px', paddingRight: 80, fontSize: 10, color: '#93C5FD',
        lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: 220, overflowY: 'auto',
      }}>
        {code}
      </pre>
      <button onClick={copy} style={{
        position: 'absolute', top: 8, right: 8,
        background: copied ? 'rgba(111,207,151,0.15)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${copied ? 'rgba(111,207,151,0.40)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        color: copied ? '#6FCF97' : 'rgba(255,255,255,0.65)',
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
      }}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? labelOk : label}
      </button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Alianzas() {
  const { lang } = useLang();
  const es = lang !== 'en';
  const t = (esStr, enStr) => es ? esStr : enStr;

  const TABS = [
    { key: 'mapa',   icon: '🗺️', label: t('Widget Mapa',     'Map Widget') },
    { key: 'boton',  icon: '📍', label: t('Botón Reporte',   'Report Button') },
    { key: 'api',    icon: '⚙️', label: t('API Pública',     'Public API') },
    { key: 'datos',  icon: '📦', label: t('Compartir datos', 'Share Data') },
  ];

  const [tab, setTab] = useState('mapa');
  const [copiadoApi, setCopiadoApi] = useState('');

  const copiarApi = (url, key) => {
    navigator.clipboard.writeText(url);
    setCopiadoApi(key);
    setTimeout(() => setCopiadoApi(''), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      <TopBar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">

        <Link to="/" className="flex items-center gap-1 text-sm mb-5" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          <ChevronLeft size={15} /> {t('Volver', 'Go back')}
        </Link>

        {/* Hero */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ fontSize: 30 }}>🤝</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#F0F6FC', margin: 0, letterSpacing: '-0.02em' }}>
                {t('Compartimos nuestros datos', 'We share our data')}
              </h1>
              <p style={{ fontSize: 11, color: '#F5C518', margin: 0, fontWeight: 600 }}>StatusVzla.com · {t('Integración gratuita', 'Free integration')}</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
            {t(
              'Si tienes una plataforma o sitio web relacionado con la emergencia en Venezuela, integra nuestros widgets de forma gratuita. Sin registro ni costo.',
              'If you have a platform or website related to the emergency in Venezuela, integrate our widgets for free. No registration or cost.',
            )}
          </p>
        </div>

        {/* Aviso */}
        <div className="mb-5 rounded-xl px-4 py-3" style={{ background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.22)' }}>
          <p style={{ fontSize: 12, color: '#FCD34D', lineHeight: 1.55, margin: 0 }}>
            ⚡ {t(
              'La precisión de los datos depende de quienes los reportan. Cuantas más fuentes compartan con nosotros, mejor será la información para todos.',
              'Data accuracy depends on who reports it. The more sources share with us, the better the information for everyone.',
            )}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)} style={{
              padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: tab === tb.key ? '#F0F6FC' : 'rgba(255,255,255,0.06)',
              color: tab === tb.key ? '#0D1117' : 'rgba(255,255,255,0.65)',
              border: `1px solid ${tab === tb.key ? 'transparent' : 'rgba(255,255,255,0.10)'}`,
              whiteSpace: 'nowrap',
            }}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Widget Mapa ── */}
        {tab === 'mapa' && (
          <div>
            <SectionHeader
              icon={<Globe size={15} style={{ color: '#6FCF97' }} />}
              title={t('Widget de mapa embebido', 'Embedded map widget')}
              desc={t(
                'Muestra el mapa de daños de Venezuela en tu sitio web. Copia y pega el código en cualquier página HTML.',
                'Show Venezuela\'s damage map on your website. Copy and paste the code into any HTML page.',
              )}
            />

            {/* Por qué no iframe */}
            <div className="mb-4 rounded-lg px-4 py-3" style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.22)' }}>
              <p style={{ fontSize: 11, color: '#FCD34D', lineHeight: 1.55, margin: 0 }}>
                ℹ️ <strong>{t('¿Por qué no un iframe?', 'Why not an iframe?')}</strong>{' '}
                {t(
                  'Los navegadores modernos bloquean iframes de otros dominios por seguridad (cabecera X-Frame-Options / CSP). Nuestro widget usa directamente la API pública con Leaflet: más rápido, ligero y compatible con todos los navegadores y CMS.',
                  'Modern browsers block cross-origin iframes for security (X-Frame-Options / CSP headers). Our widget uses our public API directly with Leaflet — faster, lighter, and compatible with all browsers and CMS platforms.',
                )}
              </p>
            </div>

            {/* Vista previa */}
            <a href="/mapa-danos" target="_blank" rel="noopener noreferrer" className="mb-4" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, height: 110, borderRadius: 12, textDecoration: 'none',
              border: '2px dashed rgba(111,207,151,0.30)', background: 'rgba(111,207,151,0.04)',
            }}>
              <span style={{ fontSize: 28 }}>🗺️</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6FCF97' }}>{t('Ver mapa en vivo →', 'View live map →')}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>statusvzla.com/mapa-danos</span>
            </a>

            {/* Instrucciones paso a paso */}
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 10px' }}>
              {t('Cómo integrarlo', 'How to integrate')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                t('Copia el código de abajo.', 'Copy the code below.'),
                t('Pégalo en el HTML de tu página, donde quieras que aparezca el mapa.', 'Paste it in your page HTML where you want the map to appear.'),
                t('El mapa cargará automáticamente con los datos más recientes de nuestra API.', 'The map will load automatically with the latest data from our API.'),
                t('Puedes cambiar height:400px a la altura que necesites.', 'You can change height:400px to any height you need.'),
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2471A3', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>

            <CodeBlock
              code={SNIPPET_MAPA_JS}
              label={t('Copiar código', 'Copy code')}
              labelOk={t('¡Copiado!', 'Copied!')}
            />

            <AttributionNote t={t} />

            {/* CTA */}
            <div className="mt-4 rounded-xl px-4 py-4" style={{ background: 'rgba(36,113,163,0.08)', border: '1px solid rgba(59,130,246,0.20)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: '0 0 10px' }}>
                🏗️ {t('¿Conoces un edificio dañado? Repórtalo y aparecerá en el mapa.', 'Know a damaged building? Report it and it will appear on the map.')}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link to="/reportar-dano" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: '#C0392B', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                  📍 {t('Reportar edificio', 'Report a building')}
                </Link>
                <Link to="/edificios" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#F0F6FC', borderRadius: 10, textDecoration: 'none', fontSize: 12 }}>
                  🔄 {t('Actualizar uno existente', 'Update existing')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Botón Reporte ── */}
        {tab === 'boton' && (
          <div>
            <SectionHeader
              icon={<MousePointerClick size={15} style={{ color: '#F87171' }} />}
              title={t('Botón flotante de reporte', 'Floating report button')}
              desc={t(
                'Agrega un botón en tu sitio para que tus visitantes reporten edificios dañados. Aparece en la esquina inferior derecha, igual que en StatusVzla.com.',
                'Add a button to your site so visitors can report damaged buildings. It appears in the bottom-right corner, just like on StatusVzla.com.',
              )}
            />

            {/* Preview */}
            <div className="mb-5 rounded-xl p-4 flex flex-col items-center gap-3" style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.22)' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: 0 }}>{t('Vista previa', 'Preview')}</p>
              <a href="/reportar-dano" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#C0392B', color: '#fff', padding: '13px 20px',
                borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 13,
                boxShadow: '0 4px 16px rgba(192,57,43,0.55)',
              }}>
                📍 {t('Reportar edificio dañado', 'Report damaged building')}
              </a>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', margin: 0 }}>Powered by StatusVzla.com</p>
            </div>

            {/* Opción 1 */}
            <OptionLabel n={1} title={t('Script automático (recomendado)', 'Auto script (recommended)')} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10, lineHeight: 1.55 }}>
              {t('Pega este código justo antes de ', 'Paste this code just before ')}<code style={{ color: '#93C5FD', fontSize: 10 }}>&lt;/body&gt;</code>{t('. El botón flotante aparecerá automáticamente en la esquina inferior derecha de tu sitio.', '. The floating button will appear automatically in the bottom-right corner of your site.')}
            </p>
            <CodeBlock code={SNIPPET_BTN_SCRIPT} label={t('Copiar', 'Copy')} labelOk={t('¡Copiado!', 'Copied!')} />

            <div style={{ margin: '16px 0' }} />

            {/* Opción 2 */}
            <OptionLabel n={2} title={t('HTML puro (sin script externo)', 'Plain HTML (no external script)')} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10, lineHeight: 1.55 }}>
              {t('Si prefieres no cargar scripts externos, pega este bloque HTML donde necesites el botón.', 'If you prefer no external scripts, paste this HTML block wherever you need the button.')}
            </p>
            <CodeBlock code={SNIPPET_BTN_HTML} label={t('Copiar', 'Copy')} labelOk={t('¡Copiado!', 'Copied!')} />

            <AttributionNote t={t} />
          </div>
        )}

        {/* ── TAB: API Pública ── */}
        {tab === 'api' && (
          <div>
            <SectionHeader
              icon={<Code size={15} style={{ color: '#A78BFA' }} />}
              title={t('API pública de edificios', 'Public buildings API')}
              desc={t('Acceso directo a nuestros datos. Sin registro. Sin costo. Caché de 90 min. Compatible con Leaflet, QGIS, Mapbox y cualquier stack.', 'Direct access to our data. No registration. No cost. 90-min cache. Compatible with Leaflet, QGIS, Mapbox and any stack.')}
            />

            {/* Tabla de endpoints */}
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {t('Endpoints disponibles', 'Available endpoints')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {ENDPOINTS.map(ep => (
                <div key={ep.key} style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 3px' }}>{es ? ep.desc.es : ep.desc.en}</p>
                    <code style={{ fontSize: 10, color: '#93C5FD', wordBreak: 'break-all', lineHeight: 1.5 }}>{ep.url}</code>
                  </div>
                  <button onClick={() => copiarApi(ep.url, ep.key)} style={{
                    flexShrink: 0,
                    background: copiadoApi === ep.key ? 'rgba(111,207,151,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${copiadoApi === ep.key ? 'rgba(111,207,151,0.40)' : 'rgba(255,255,255,0.10)'}`,
                    borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
                    color: copiadoApi === ep.key ? '#6FCF97' : 'rgba(255,255,255,0.55)',
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
                  }}>
                    {copiadoApi === ep.key ? <Check size={10} /> : <Copy size={10} />}
                    {copiadoApi === ep.key ? t('OK', 'OK') : t('Copiar', 'Copy')}
                  </button>
                </div>
              ))}
            </div>

            {/* Ejemplo de respuesta */}
            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.22)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C4B5FD', margin: '0 0 6px' }}>
                📋 {t('Ejemplo de respuesta (?format=list)', 'Sample response (?format=list)')}
              </p>
              <code style={{ fontSize: 10, color: '#DDD6FE', lineHeight: 1.6, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`{
  "ok": true,
  "metadata": { "total": 382, "generated_at": "..." },
  "edificios": [{
    "numero": 1,
    "id": "abc123",
    "nombre": "Torre Parque Central",
    "nivel_dano": "grave",
    "direccion": "Av. Lecuna",
    "ciudad": "Caracas",
    "estado_region": "Distrito Capital",
    "lat": 10.508, "lng": -66.917,
    "url": "https://statusvzla.com/edificio?id=abc123"
  }]
}`}</code>
            </div>

            {/* Ejemplo GeoJSON */}
            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(36,113,163,0.07)', border: '1px solid rgba(59,130,246,0.20)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', margin: '0 0 6px' }}>
                🗺️ {t('Ejemplo GeoJSON (?format=geojson)', 'GeoJSON sample (?format=geojson)')}
              </p>
              <code style={{ fontSize: 10, color: '#BAE6FD', lineHeight: 1.6, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-66.917, 10.508] },
    "properties": {
      "id": "abc123", "nombre": "Torre Parque Central",
      "nivel_dano": "grave", "ciudad": "Caracas",
      "url": "https://statusvzla.com/edificio?id=abc123"
    }
  }]
}`}</code>
            </div>

            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>
              ℹ️ {t('Los datos se actualizan con cada reporte ciudadano. El caché se refresca automáticamente cada 90 minutos. CORS habilitado para llamadas desde el navegador.', 'Data updates with each citizen report. Cache auto-refreshes every 90 minutes. CORS enabled for browser-side calls.')}
            </p>
          </div>
        )}

        {/* ── TAB: Compartir Datos ── */}
        {tab === 'datos' && (
          <div>
            <SectionHeader
              icon={<Database size={15} style={{ color: '#60A5FA' }} />}
              title={t('¿Tienes datos que pueden ayudar?', 'Do you have data that can help?')}
              desc={t(
                'Si tu organización tiene información actualizada sobre personas, edificios, refugios o zonas afectadas, podemos integrarla para que llegue a más personas.',
                'If your organization has updated information about people, buildings, shelters or affected areas, we can integrate it to reach more people.',
              )}
            />

            {/* CTA email */}
            <div className="mb-5 rounded-xl px-4 py-4" style={{ background: 'rgba(36,113,163,0.10)', border: '1px solid rgba(59,130,246,0.22)' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 14 }}>
                {t('Escríbenos con el tipo de datos que tienes, la frecuencia de actualización y el formato (CSV, Excel, JSON, API). Lo analizamos y te contactamos.', 'Write to us with the type of data you have, the update frequency and format (CSV, Excel, JSON, API). We\'ll review and contact you.')}
              </p>
              <a href="mailto:villenagv@gmail.com?subject=Alianza%20StatusVzla%20-%20Datos" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
                background: '#2471A3', color: '#fff', borderRadius: 12, textDecoration: 'none',
                fontSize: 13, fontWeight: 700,
              }}>
                <Mail size={14} /> villenagv@gmail.com
              </a>
            </div>

            {/* GitHub */}
            <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: '#111318' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>
                  <Code size={13} style={{ display: 'inline', marginRight: 6, color: '#C4B5FD', verticalAlign: 'middle' }} />
                  {t('Código abierto · GitHub', 'Open source · GitHub')}
                </p>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {[
                  { emoji: '⭐', label: 'villenagv/status-vzla', sub: 'github.com/villenagv/status-vzla', url: 'https://github.com/villenagv/status-vzla', badge: 'GitHub ↗', color: '#C4B5FD' },
                  { emoji: '📄', label: t('Documentación técnica', 'Technical docs (README)'), sub: 'README', url: 'https://github.com/villenagv/status-vzla/blob/main/README.md', badge: 'README ↗', color: '#C4B5FD' },
                  { emoji: '🐛', label: t('Reportar errores o mejoras', 'Report bugs / suggestions'), sub: 'GitHub Issues', url: 'https://github.com/villenagv/status-vzla/issues', badge: 'Issues ↗', color: '#F87171' },
                ].map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', textDecoration: 'none',
                  }}>
                    <span style={{ fontSize: 18 }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 10, color: '#9BA5B0', margin: 0 }}>{item.sub}</p>
                    </div>
                    <span style={{ fontSize: 10, color: item.color, fontWeight: 600, flexShrink: 0 }}>{item.badge}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quiénes */}
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              {t('¿Quiénes pueden participar?', 'Who can participate?')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-5">
              {[
                { icon: '🏥', es: 'Hospitales y clínicas', en: 'Hospitals & clinics' },
                { icon: '🏛️', es: 'Alcaldías y gobernaciones', en: 'Municipalities' },
                { icon: '🤝', es: 'ONGs y voluntarios', en: 'NGOs & volunteers' },
                { icon: '📰', es: 'Medios de comunicación', en: 'News outlets' },
                { icon: '🛠️', es: 'Desarrolladores', en: 'Developers' },
                { icon: '🚒', es: 'Protección Civil', en: 'Civil Protection' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 500, lineHeight: 1.3 }}>{es ? item.es : item.en}</span>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
                {t('StatusVzla.com es una plataforma ciudadana sin fines de lucro. Toda alianza es voluntaria, transparente y orientada al bien común. No vendemos información ni datos personales.', 'StatusVzla.com is a non-profit citizen platform. All partnerships are voluntary, transparent, and for the common good. We do not sell data or personal information.')}
              </p>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}

// ── Sub-componentes locales ───────────────────────────────────────────────────

function SectionHeader({ icon, title, desc }) {
  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: '#111318' }}>
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>{title}</span>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function OptionLabel({ n, title }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-4">
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2471A3', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{title}</p>
    </div>
  );
}

function AttributionNote({ t }) {
  return (
    <div className="mt-3 rounded-lg px-4 py-3" style={{ background: 'rgba(111,207,151,0.06)', border: '1px solid rgba(111,207,151,0.18)' }}>
      <p style={{ fontSize: 11, color: '#6FCF97', margin: 0, lineHeight: 1.5 }}>
        📌 <strong>{t('Atribución requerida:', 'Attribution required:')}</strong>{' '}
        {t('Debes mantener visible el texto "Powered by StatusVzla.com". Ya está incluido en el código.', 'You must keep "Powered by StatusVzla.com" visible. Already included in the code.')}
      </p>
    </div>
  );
}
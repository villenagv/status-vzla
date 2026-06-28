import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Copy, Check, Globe, Database, Code, Mail } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const BASE_URL = 'https://statusvzla.com/functions/apiMapa';

const EJEMPLOS = [
  { label: 'Todos los datos',         url: BASE_URL },
  { label: 'Solo Caracas',            url: `${BASE_URL}?ciudad=Caracas` },
  { label: 'Daño grave',              url: `${BASE_URL}?nivel=grave` },
  { label: 'Hospitales',              url: `${BASE_URL}?tipo=hospital` },
  { label: 'GeoJSON (mapas)',         url: `${BASE_URL}?format=geojson` },
  { label: 'GeoJSON · Caracas grave', url: `${BASE_URL}?ciudad=Caracas&nivel=grave&format=geojson` },
];

const CODE_LEAFLET = `// Integración rápida con Leaflet.js
// 1. Agrega Leaflet a tu HTML:
// <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
// <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

const map = L.map('map').setView([10.48, -66.90], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

fetch('${BASE_URL}?format=geojson')
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const color = {
          grave: '#DC2626', critico: '#991B1B',
          moderado: '#EA580C', leve: '#D97706',
        }[feature.properties.nivel_dano] || '#6B7280';
        return L.circleMarker(latlng, { radius: 7, color, fillOpacity: 0.85 });
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindPopup(\`
          <b>\${p.nombre || p.tipo_estructura}</b><br>
          Daño: \${p.nivel_dano}<br>
          Acceso: \${p.estado_acceso}<br>
          <a href="\${p.url}" target="_blank">Ver ficha →</a><br>
          <small>Powered by <a href="https://statusvzla.com">StatusVzla.com</a></small>
        \`);
      }
    }).addTo(map);
    // Pie de mapa — obligatorio al usar la API
    map.attributionControl.addAttribution(
      '© <a href="https://statusvzla.com">StatusVzla.com</a>'
    );
  });`;

const CODE_FETCH = `// Fetch simple — cualquier framework JS
fetch('${BASE_URL}?ciudad=Caracas')
  .then(r => r.json())
  .then(({ edificios, refugios, metadata }) => {
    console.log('Powered by:', metadata.powered_by);
    console.log('Edificios:', edificios.length);
    console.log('Refugios:', refugios.length);
    // Muestra los datos como necesites
  });`;

const CODE_PYTHON = `# Python — integración con pandas / geopandas
import requests, pandas as pd

resp = requests.get('${BASE_URL}')
data = resp.json()

df = pd.DataFrame(data['edificios'])
print(df[['nombre','nivel_dano','ubicacion']].head())
# powered_by: data['metadata']['powered_by']`;

export default function Alianzas() {
  const { lang } = useLang();
  const es = lang !== 'en';
  const [copiado, setCopiado] = useState(null);
  const [tabCodigo, setTabCodigo] = useState('leaflet');

  const copiar = (texto, key) => {
    navigator.clipboard.writeText(texto);
    setCopiado(key);
    setTimeout(() => setCopiado(null), 2000);
  };

  const t = (esStr, enStr) => es ? esStr : enStr;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      <TopBar />
      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm mb-5" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          <ChevronLeft size={15} /> {t('Volver', 'Go back')}
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div style={{ fontSize: 32 }}>🤝</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#F0F6FC', margin: 0, letterSpacing: '-0.02em' }}>
                {t('Compartamos esfuerzos', 'Let\'s share our efforts')}
              </h1>
              <p style={{ fontSize: 12, color: '#F5C518', margin: 0, fontWeight: 600 }}>StatusVzla.com · API pública</p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', lineHeight: 1.65, margin: 0 }}>
            {t(
              'Si tienes una plataforma, mapa, aplicación o base de datos relacionada con la emergencia en Venezuela, podemos sumar fuerzas. Usa nuestra API gratuita de datos geoespaciales o contáctanos para intercambiar información.',
              'If you have a platform, map, app, or database related to the emergency in Venezuela, we can join forces. Use our free geospatial data API or contact us to exchange information.'
            )}
          </p>
        </div>

        {/* Aviso de dependencia de datos */}
        <div className="mb-6 rounded-xl p-4" style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.25)' }}>
          <p style={{ fontSize: 13, color: '#FCD34D', lineHeight: 1.6, margin: 0 }}>
            <strong>⚡ {t('Importante:', 'Important:')}</strong>{' '}
            {t(
              'La calidad y actualización de esta información depende directamente del acceso que tengamos a datos del terreno. Cuantas más fuentes institucionales, ONGs y redes ciudadanas compartan con nosotros, más precisa y oportuna será la información disponible para todos.',
              'The quality and freshness of this data depends directly on the access we have to ground-level information. The more institutional sources, NGOs, and citizen networks share with us, the more accurate and timely the information available to everyone.'
            )}
          </p>
        </div>

        {/* API Info */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: '#111318' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} style={{ color: '#4A9EDB' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FC' }}>
                {t('Endpoint público — 0 créditos de integración', 'Public endpoint — 0 integration credits')}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
              {t('Caché de 90 minutos · CORS abierto · Sin autenticación requerida', '90-minute cache · Open CORS · No authentication required')}
            </p>
          </div>
          <div className="px-5 py-4">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {t('URLs disponibles', 'Available URLs')}
            </p>
            <div className="flex flex-col gap-2">
              {EJEMPLOS.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="min-w-0">
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 2px' }}>{e.label}</p>
                    <code style={{ fontSize: 10, color: '#93C5FD', wordBreak: 'break-all' }}>{e.url}</code>
                  </div>
                  <button onClick={() => copiar(e.url, `url-${i}`)}
                    style={{ flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: copiado === `url-${i}` ? '#6FCF97' : 'rgba(255,255,255,0.65)' }}>
                    {copiado === `url-${i}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Parámetros */}
          <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {t('Parámetros', 'Parameters')}
            </p>
            <div className="flex flex-col gap-2">
              {[
                { param: 'ciudad', desc: t('Filtrar por ciudad (ej. Caracas, Valencia)', 'Filter by city (e.g. Caracas, Valencia)') },
                { param: 'nivel', desc: t('leve · moderado · grave · critico · colapsado', 'leve · moderado · grave · critico · colapsado') },
                { param: 'tipo', desc: t('hospital · escuela · edificio_residencial · comercio...', 'hospital · escuela · edificio_residencial · comercio...') },
                { param: 'format', desc: t('json (defecto) · geojson (compatible con Leaflet, Mapbox, QGIS)', 'json (default) · geojson (compatible with Leaflet, Mapbox, QGIS)') },
              ].map(p => (
                <div key={p.param} className="flex gap-3 items-start">
                  <code style={{ fontSize: 11, color: '#F5C518', background: 'rgba(245,197,24,0.10)', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>?{p.param}</code>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', lineHeight: 1.5 }}>{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Código de integración */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: '#111318' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <Code size={15} style={{ color: '#4A9EDB' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FC' }}>
              {t('Cómo integrarlo', 'How to integrate')}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex px-5 pt-4 gap-2">
            {[
              { key: 'leaflet', label: 'Leaflet.js' },
              { key: 'fetch',   label: 'Fetch / JS' },
              { key: 'python',  label: 'Python' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setTabCodigo(tab.key)}
                style={{
                  padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: tabCodigo === tab.key ? '#4A9EDB' : 'rgba(255,255,255,0.07)',
                  color: tabCodigo === tab.key ? '#fff' : 'rgba(255,255,255,0.60)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative mx-5 my-4">
            <pre style={{
              background: '#0D1117', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10,
              padding: '14px 16px', fontSize: 10.5, color: '#93C5FD', overflowX: 'auto',
              lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {tabCodigo === 'leaflet' ? CODE_LEAFLET : tabCodigo === 'fetch' ? CODE_FETCH : CODE_PYTHON}
            </pre>
            <button onClick={() => copiar(tabCodigo === 'leaflet' ? CODE_LEAFLET : tabCodigo === 'fetch' ? CODE_FETCH : CODE_PYTHON, 'code')}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                color: copiado === 'code' ? '#6FCF97' : 'rgba(255,255,255,0.65)',
              }}>
              {copiado === 'code' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          {/* Nota de atribución obligatoria */}
          <div className="mx-5 mb-5 rounded-lg px-4 py-3" style={{ background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.20)' }}>
            <p style={{ fontSize: 11, color: '#FCD34D', margin: 0, lineHeight: 1.55 }}>
              📌 <strong>{t('Atribución requerida:', 'Attribution required:')}</strong>{' '}
              {t(
                'Al usar esta API debes mostrar visiblemente "Powered by StatusVzla.com" en tu interfaz o mapa. Los ejemplos de código ya lo incluyen.',
                'When using this API you must visibly display "Powered by StatusVzla.com" in your interface or map. The code examples already include it.'
              )}
            </p>
          </div>
        </div>

        {/* Mapa Embebido */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: '#111318' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} style={{ color: '#6FCF97' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FC' }}>
                {t('Opción rápida: mapa embebido (iframe)', 'Quick option: embedded map (iframe)')}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
              {t('Sin código, sin API. Copia y pega en tu sitio web.', 'No code, no API. Copy and paste into your website.')}
            </p>
          </div>

          {/* Vista previa del mapa */}
          <div className="mx-5 mt-4" style={{ position: 'relative', width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
            <iframe
              src="https://statusvzla.com/mapa-danos"
              width="100%"
              height="100%"
              frameBorder="0"
              title="Mapa Status Vzla"
              loading="lazy"
              style={{ display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'rgba(13,17,23,0.85)', border: '1px solid rgba(245,197,24,0.40)',
              padding: '4px 10px', borderRadius: 8,
              fontSize: 10, fontWeight: 800, color: '#F5C518',
              letterSpacing: '0.02em',
            }}>
              Powered by StatusVzla.com
            </div>
          </div>

          {/* Código del iframe */}
          <div className="relative mx-5 my-4">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t('Código para copiar en tu web', 'Code to copy into your website')}
            </p>
            <pre style={{
              background: '#0D1117', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10,
              padding: '14px 16px', fontSize: 10.5, color: '#93C5FD', overflowX: 'auto',
              lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
{`<div style="position:relative;width:100%;height:500px;border-radius:12px;overflow:hidden;">
  <iframe
    src="https://statusvzla.com/mapa-danos"
    width="100%"
    height="100%"
    frameborder="0"
    title="Mapa Status Vzla"
    loading="lazy">
  </iframe>
  <div style="position:absolute;bottom:10px;right:10px;background:rgba(13,17,23,0.85);padding:4px 10px;border-radius:8px;font-size:10px;font-weight:800;color:#F5C518;border:1px solid rgba(245,197,24,0.40);">
    Powered by StatusVzla.com
  </div>
</div>`}
            </pre>
            <button onClick={() => copiar(`<div style="position:relative;width:100%;height:500px;border-radius:12px;overflow:hidden;">\n  <iframe\n    src="https://statusvzla.com/mapa-danos"\n    width="100%"\n    height="100%"\n    frameborder="0"\n    title="Mapa Status Vzla"\n    loading="lazy">\n  </iframe>\n  <div style="position:absolute;bottom:10px;right:10px;background:rgba(13,17,23,0.85);padding:4px 10px;border-radius:8px;font-size:10px;font-weight:800;color:#F5C518;border:1px solid rgba(245,197,24,0.40);">\n    Powered by StatusVzla.com\n  </div>\n</div>`, 'iframe')}
              style={{
                position: 'absolute', top: 34, right: 8,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                color: copiado === 'iframe' ? '#6FCF97' : 'rgba(255,255,255,0.65)',
              }}>
              {copiado === 'iframe' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          <div className="mx-5 mb-5 rounded-lg px-4 py-3" style={{ background: 'rgba(111,207,151,0.07)', border: '1px solid rgba(111,207,151,0.20)' }}>
            <p style={{ fontSize: 11, color: '#6FCF97', margin: 0, lineHeight: 1.55 }}>
              ✅ <strong>{t('Sin costo ni configuración.', 'No cost or setup.')}</strong>{' '}
              {t(
                'El mapa se carga de forma diferida (lazy) para no afectar la velocidad de tu sitio. Funciona en WordPress, Wix, HTML y cualquier framework.',
                'The map loads lazily so it does not slow down your site. Works on WordPress, Wix, HTML, and any framework.'
              )}
            </p>
          </div>
        </div>

        {/* Llamado a alianzas */}
        <div className="mb-6 rounded-2xl p-5" style={{ background: 'rgba(36,113,163,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} style={{ color: '#60A5FA' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>
              {t('¿Tienes datos que pueden ayudar?', 'Do you have data that can help?')}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.65, marginBottom: 14 }}>
            {t(
              'Si tu organización, municipio, ONG, hospital o institución tiene acceso a información actualizada sobre personas, edificios, refugios o zonas afectadas, podemos integrarla a la plataforma para que llegue a más personas. También si tienes una API propia o base de datos que quieras conectar.',
              'If your organization, municipality, NGO, hospital, or institution has access to updated information about people, buildings, shelters, or affected areas, we can integrate it into the platform so it reaches more people. Also if you have your own API or database you want to connect.'
            )}
          </p>
          <a href="mailto:villenagv@gmail.com?subject=Alianza%20StatusVzla%20-%20Datos"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              background: '#2471A3', color: '#fff', borderRadius: 12, textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
            }}>
            <Mail size={14} />
            {t('Escríbenos a villenagv@gmail.com', 'Email us at villenagv@gmail.com')}
          </a>
        </div>

        {/* Quiénes pueden aliarse */}
        <div className="mb-6">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            {t('¿Quiénes pueden aliarse?', 'Who can partner with us?')}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { icon: '🏥', es: 'Hospitales y clínicas', en: 'Hospitals & clinics' },
              { icon: '🏛️', es: 'Alcaldías y gobernaciones', en: 'Municipalities & governments' },
              { icon: '🤝', es: 'ONGs y voluntarios', en: 'NGOs & volunteers' },
              { icon: '📰', es: 'Medios de comunicación', en: 'News outlets' },
              { icon: '🛠️', es: 'Desarrolladores', en: 'Developers' },
              { icon: '🎓', es: 'Universidades e institutos', en: 'Universities & institutes' },
              { icon: '🚒', es: 'Protección Civil y Bomberos', en: 'Civil Protection & Firefighters' },
              { icon: '📊', es: 'Analistas de datos', en: 'Data analysts' },
              { icon: '🌍', es: 'Organizaciones internacionales', en: 'International organizations' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 500, lineHeight: 1.35 }}>{es ? item.es : item.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
            {t(
              'StatusVzla.com es una plataforma ciudadana sin fines de lucro. Toda alianza de datos es voluntaria, transparente y orientada al bien común. No vendemos información ni datos personales.',
              'StatusVzla.com is a non-profit citizen platform. All data partnerships are voluntary, transparent, and oriented toward the common good. We do not sell information or personal data.'
            )}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
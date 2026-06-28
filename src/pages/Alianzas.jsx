import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Copy, Check, Globe, Database, Mail, Code } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';


const JS_WIDGET_CODE = `<!-- Widget de Mapa StatusVzla.com -->
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

export default function Alianzas() {
  const { lang } = useLang();
  const es = lang !== 'en';
  const [copiado, setCopiado] = useState(false);
  const [copiadoApi, setCopiadoApi] = useState('');
  const [copiadoWidget, setCopiadoWidget] = useState(false);

  const copiarApi = (texto, key) => {
    navigator.clipboard.writeText(texto);
    setCopiadoApi(key);
    setTimeout(() => setCopiadoApi(''), 2000);
  };

  const copiarWidget = () => {
    navigator.clipboard.writeText(JS_WIDGET_CODE);
    setCopiadoWidget(true);
    setTimeout(() => setCopiadoWidget(false), 2000);
  };

  const API_BASE = 'https://statusvzla.com/functions/apiMapa';
  const ENDPOINTS = [
    { key: 'list',    url: `${API_BASE}?format=list`,                    desc: { es: 'Listado de edificios (nombre, dirección, ciudad)', en: 'Building list (name, address, city)' } },
    { key: 'json',    url: `${API_BASE}`,                                desc: { es: 'Edificios + refugios completo (JSON estándar)',     en: 'Buildings + shelters full (standard JSON)' } },
    { key: 'geojson', url: `${API_BASE}?format=geojson`,                 desc: { es: 'Formato GeoJSON para mapas (Leaflet, QGIS, Mapbox)', en: 'GeoJSON format for maps (Leaflet, QGIS, Mapbox)' } },
    { key: 'ciudad',  url: `${API_BASE}?format=list&ciudad=Caracas`,     desc: { es: 'Filtrar por ciudad',                               en: 'Filter by city' } },
    { key: 'nivel',   url: `${API_BASE}?format=list&nivel=grave`,        desc: { es: 'Filtrar por nivel de daño',                        en: 'Filter by damage level' } },
    { key: 'tipo',    url: `${API_BASE}?format=list&tipo=hospital`,      desc: { es: 'Filtrar por tipo de estructura',                   en: 'Filter by structure type' } },
  ];



  const t = (esStr, enStr) => es ? esStr : enStr;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      <TopBar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm mb-5" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          <ChevronLeft size={15} /> {t('Volver', 'Go back')}
        </Link>

        {/* Hero */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div style={{ fontSize: 32 }}>🤝</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#F0F6FC', margin: 0, letterSpacing: '-0.02em' }}>
                {t('Compartimos nuestros datos', 'We share our data')}
              </h1>
              <p style={{ fontSize: 12, color: '#F5C518', margin: 0, fontWeight: 600 }}>StatusVzla.com</p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', lineHeight: 1.65, margin: 0 }}>
            {t(
              'Si tienes una plataforma, sitio web o aplicación relacionada con la emergencia en Venezuela, puedes integrar nuestro mapa de daños de forma gratuita. Solo copia y pega el código.',
              'If you have a platform, website or app related to the emergency in Venezuela, you can integrate our damage map for free. Just copy and paste the code.'
            )}
          </p>
        </div>

        {/* Aviso importante */}
        <div className="mb-6 rounded-xl p-4" style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.25)' }}>
          <p style={{ fontSize: 13, color: '#FCD34D', lineHeight: 1.6, margin: 0 }}>
            <strong>⚡ {t('Importante:', 'Important:')}</strong>{' '}
            {t(
              'La precisión de los datos depende de los ciudadanos e instituciones que los reportan. Cuantas más fuentes compartan con nosotros, mejor será la información para todos.',
              'Data accuracy depends on the citizens and institutions that report it. The more sources that share with us, the better the information for everyone.'
            )}
          </p>
        </div>

        {/* Widget de mapa embebido via API */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#111318' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} style={{ color: '#6FCF97' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>
                {t('Widget de mapa — para tu sitio web', 'Map widget — for your website')}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
              {t('Copia el código y pégalo en cualquier página HTML. Sin registro ni costo. Usa nuestra API pública con Leaflet.', 'Copy the code and paste it into any HTML page. No registration or cost. Uses our public API with Leaflet.')}
            </p>
          </div>

          {/* Info técnica por qué no iframe */}
          <div className="mx-5 mt-4 rounded-lg px-4 py-3" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}>
            <p style={{ fontSize: 11, color: '#FCD34D', lineHeight: 1.55, margin: 0 }}>
              ℹ️ <strong>{t('¿Por qué no un iframe?', 'Why not an iframe?')}</strong>{' '}
              {t(
                'Los navegadores modernos bloquean iframes cruzados por seguridad (X-Frame-Options). Este widget usa directamente nuestra API pública con Leaflet, lo que es más rápido, ligero y compatible con todos los navegadores.',
                'Modern browsers block cross-origin iframes for security (X-Frame-Options). This widget uses our public API directly with Leaflet — faster, lighter, and compatible with all browsers.'
              )}
            </p>
          </div>

          {/* Vista previa */}
          <div className="mx-5 mt-4">
            <a href="/mapa-danos" target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, height: 130, borderRadius: 12, textDecoration: 'none',
              border: '2px dashed rgba(111,207,151,0.35)', background: 'rgba(111,207,151,0.05)',
            }}>
              <span style={{ fontSize: 30 }}>🗺️</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6FCF97', margin: 0 }}>
                {t('Ver mapa en vivo →', 'View live map →')}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: 0 }}>statusvzla.com/mapa-danos</p>
            </a>
          </div>

          {/* Código copiable */}
          <div className="relative mx-5 my-4">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t('Código del widget para tu web', 'Widget code for your website')}
            </p>
            <pre style={{
              background: '#0D1117', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10,
              padding: '14px 16px', fontSize: 10, color: '#93C5FD', overflowX: 'auto',
              lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200,
            }}>
              {JS_WIDGET_CODE}
            </pre>
            <button onClick={copiarWidget} style={{
              position: 'absolute', top: 34, right: 8,
              background: copiadoWidget ? 'rgba(111,207,151,0.15)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${copiadoWidget ? 'rgba(111,207,151,0.40)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
              color: copiadoWidget ? '#6FCF97' : 'rgba(255,255,255,0.65)',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
            }}>
              {copiadoWidget ? <Check size={12} /> : <Copy size={12} />}
              {copiadoWidget ? t('¡Copiado!', 'Copied!') : t('Copiar', 'Copy')}
            </button>
          </div>

          <div className="mx-5 mb-3 rounded-lg px-4 py-3" style={{ background: 'rgba(111,207,151,0.07)', border: '1px solid rgba(111,207,151,0.20)' }}>
            <p style={{ fontSize: 11, color: '#6FCF97', margin: 0, lineHeight: 1.55 }}>
              📌 <strong>{t('Atribución requerida:', 'Attribution required:')}</strong>{' '}
              {t(
                'Al usar este widget debes mantener visible el texto "Powered by StatusVzla.com". Ya está incluido en el código.',
                'When using this widget you must keep "Powered by StatusVzla.com" visible. It\'s already included in the code.'
              )}
            </p>
          </div>

          {/* CTA — Reportar o actualizar edificio */}
          <div className="mx-5 mb-5 rounded-xl px-4 py-4" style={{ background: 'rgba(36,113,163,0.10)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FC', margin: '0 0 4px' }}>
              🏗️ {t('¿Sabes de un edificio dañado?', 'Do you know of a damaged building?')}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', lineHeight: 1.55, margin: '0 0 12px' }}>
              {t(
                'Si tienes información sobre daños, personas atrapadas o el estado de acceso de un edificio, repórtalo o actualiza la información existente.',
                'If you have information about damage, trapped people, or access status of a building, report it or update the existing record.'
              )}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to="/reportar-dano" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#C0392B', color: '#fff',
                borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 700,
              }}>
                📍 {t('Reportar edificio', 'Report a building')}
              </Link>
              <Link to="/edificios" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#F0F6FC', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 600,
              }}>
                🔄 {t('Actualizar uno existente', 'Update an existing one')}
              </Link>
            </div>
          </div>
        </div>

        {/* Código abierto y GitHub */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#111318' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Code size={16} style={{ color: '#C4B5FD' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>
                {t('Código abierto · GitHub', 'Open source · GitHub')}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
              {t('El código de StatusVzla.com es público. Puedes revisarlo, mejorarlo o usarlo como base para tu propia plataforma de emergencias.', 'StatusVzla.com\'s code is public. You can review it, improve it, or use it as a base for your own emergency platform.')}
            </p>
          </div>
          <div className="px-5 py-4">
            <div className="flex flex-col gap-3">
              <a href="https://github.com/villenagv/status-vzla" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0D1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>⭐</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>villenagv/status-vzla</p>
                  <p style={{ fontSize: 10, color: '#9BA5B0', margin: 0 }}>github.com/villenagv/status-vzla</p>
                </div>
                <span style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600, flexShrink: 0 }}>GitHub ↗</span>
              </a>
              <a href="https://github.com/villenagv/status-vzla/blob/main/README.md" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0D1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>📄</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{t('Documentación técnica (README)', 'Technical documentation (README)')}</p>
                  <p style={{ fontSize: 10, color: '#9BA5B0', margin: 0 }}>{t('Arquitectura, endpoints y cómo contribuir', 'Architecture, endpoints and how to contribute')}</p>
                </div>
                <span style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600, flexShrink: 0 }}>README ↗</span>
              </a>
              <a href="https://github.com/villenagv/status-vzla/issues" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0D1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>🐛</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{t('Reportar errores o sugerir mejoras', 'Report bugs or suggest improvements')}</p>
                  <p style={{ fontSize: 10, color: '#9BA5B0', margin: 0 }}>GitHub Issues</p>
                </div>
                <span style={{ fontSize: 11, color: '#C4B5FD', fontWeight: 600, flexShrink: 0 }}>Issues ↗</span>
              </a>
            </div>
            <div className="mt-4 rounded-lg px-4 py-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
              <p style={{ fontSize: 11, color: '#C4B5FD', lineHeight: 1.6, margin: 0 }}>
                🤝 {t('Si quieres contribuir al código, abre un Pull Request en GitHub o escríbenos. Buscamos desarrolladores, diseñadores y analistas de datos comprometidos con Venezuela.', 'If you want to contribute to the code, open a Pull Request on GitHub or write to us. We\'re looking for developers, designers and data analysts committed to Venezuela.')}
              </p>
            </div>
          </div>
        </div>

        {/* API pública */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#111318' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Code size={16} style={{ color: '#A78BFA' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>
                {t('API pública de edificios', 'Public buildings API')}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
              {t('Acceso directo a nuestros datos. Sin registro. Sin costo. Con caché de 90 min.', 'Direct data access. No registration. No cost. 90-min cache.')}
            </p>
          </div>

          <div className="px-5 py-4">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {t('Endpoints disponibles', 'Available endpoints')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ENDPOINTS.map(ep => (
                <div key={ep.key} style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 3px' }}>{es ? ep.desc.es : ep.desc.en}</p>
                      <code style={{ fontSize: 10, color: '#93C5FD', wordBreak: 'break-all', lineHeight: 1.5 }}>{ep.url}</code>
                    </div>
                    <button onClick={() => copiarApi(ep.url, ep.key)} style={{
                      flexShrink: 0, background: copiadoApi === ep.key ? 'rgba(111,207,151,0.15)' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${copiadoApi === ep.key ? 'rgba(111,207,151,0.40)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                      color: copiadoApi === ep.key ? '#6FCF97' : 'rgba(255,255,255,0.55)',
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
                    }}>
                      {copiadoApi === ep.key ? <Check size={10} /> : <Copy size={10} />}
                      {copiadoApi === ep.key ? t('¡Copiado!', 'Copied!') : t('Copiar', 'Copy')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg px-4 py-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
              <p style={{ fontSize: 11, color: '#C4B5FD', lineHeight: 1.6, margin: 0 }}>
                <strong>📋 {t('Ejemplo de respuesta (?format=list):', 'Sample response (?format=list):')}</strong><br />
                <code style={{ fontSize: 10, color: '#DDD6FE' }}>{`{ "ok": true, "metadata": { "total": 382 }, "edificios": [{ "numero": 1, "id": "...", "nombre": "Torre Parque Central", "nivel_dano": "grave", "direccion": "Av. Lecuna", "ciudad": "Caracas", ... }] }`}</code>
              </p>
            </div>

            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
              ℹ️ {t(
                'Los datos se actualizan cada vez que un ciudadano o institución reporta un edificio. El caché se refresca automáticamente cada 90 minutos.',
                'Data updates every time a citizen or institution reports a building. Cache auto-refreshes every 90 minutes.'
              )}
            </p>
          </div>
        </div>

        {/* ¿Tienes datos? */}
        <div className="mb-6 rounded-2xl p-5" style={{ background: 'rgba(36,113,163,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} style={{ color: '#60A5FA' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>
              {t('¿Tienes datos que pueden ayudar?', 'Do you have data that can help?')}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.65, marginBottom: 14 }}>
            {t(
              'Si tu organización, municipio, ONG, hospital o institución tiene información actualizada sobre personas, edificios, refugios o zonas afectadas, escríbenos. Podemos integrarla para que llegue a más personas.',
              'If your organization, municipality, NGO, hospital or institution has updated information about people, buildings, shelters or affected areas, write to us. We can integrate it so it reaches more people.'
            )}
          </p>
          <a
            href="mailto:villenagv@gmail.com?subject=Alianza%20StatusVzla%20-%20Datos"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              background: '#2471A3', color: '#fff', borderRadius: 12, textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
            }}>
            <Mail size={14} />
            villenagv@gmail.com
          </a>
        </div>

        {/* Quiénes pueden aliarse */}
        <div className="mb-6">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            {t('¿Quiénes pueden participar?', 'Who can participate?')}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { icon: '🏥', es: 'Hospitales y clínicas', en: 'Hospitals & clinics' },
              { icon: '🏛️', es: 'Alcaldías y gobernaciones', en: 'Municipalities & governments' },
              { icon: '🤝', es: 'ONGs y voluntarios', en: 'NGOs & volunteers' },
              { icon: '📰', es: 'Medios de comunicación', en: 'News outlets' },
              { icon: '🛠️', es: 'Desarrolladores', en: 'Developers' },
              { icon: '🚒', es: 'Protección Civil y Bomberos', en: 'Civil Protection & Firefighters' },
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
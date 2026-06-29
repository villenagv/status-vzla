import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import CodeBlock from './CodeBlock';
import AttributionNote from './AttributionNote';
import SectionHeader from './SectionHeader';

// Widget completo — HTML + Leaflet + API StatusVzla
const SNIPPET_MAPA = `<!-- Widget Mapa de Daños — StatusVzla.com -->
<!-- INSTRUCCIONES:
  1. Copia todo este bloque.
  2. Pégalo en tu HTML donde quieras que aparezca el mapa.
  3. Puedes cambiar height:400px a la altura que necesites.
  4. El mapa cargará automáticamente con datos en tiempo real.
  Instructions (EN): paste this block where you want the map to appear.
-->
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
  .then(function(r){ return r.json(); })
  .then(function(data){
    var map = L.map('svzla-map').setView([10.48,-66.90],8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
    var colores={leve:'#D97706',moderado:'#EA580C',grave:'#DC2626',critico:'#991B1B',colapsado:'#450A0A',no_evaluado:'#6B7280'};
    L.geoJSON(data,{
      pointToLayer:function(f,ll){
        return L.circleMarker(ll,{radius:7,fillColor:colores[f.properties.nivel_dano]||'#6B7280',color:'#fff',weight:1,fillOpacity:0.9});
      },
      onEachFeature:function(f,layer){
        var p=f.properties;
        layer.bindPopup('<b>'+(p.nombre||'Sin nombre')+'<\/b><br>Daño: '+p.nivel_dano+'<br><a href="'+p.url+'" target="_blank">Ver detalle ↗<\/a>');
      }
    }).addTo(map);
  })
  .catch(function(){ document.getElementById('svzla-map').innerHTML='<p style="padding:20px;color:#999;">No se pudo cargar el mapa. / Could not load map.</p>'; });
<\/script>`;

export default function WidgetMapa({ t }) {
  return (
    <div>
      <SectionHeader
        icon={<Globe size={15} style={{ color: '#6FCF97' }} />}
        title={t('Widget de mapa embebido', 'Embedded map widget')}
        desc={t(
          'Muestra el mapa de daños de Venezuela en tu sitio web. Copia y pega el código en cualquier página HTML. Sin registro ni costo.',
          'Show Venezuela\'s damage map on your website. Copy and paste into any HTML page. No registration or cost.'
        )}
      />

      {/* Por qué no iframe */}
      <div style={{ marginBottom: 14, borderRadius: 10, padding: '10px 14px', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.22)' }}>
        <p style={{ fontSize: 11, color: '#FCD34D', lineHeight: 1.55, margin: 0 }}>
          ℹ️ <strong>{t('¿Por qué no un iframe?', 'Why not an iframe?')}</strong>{' '}
          {t(
            'Los navegadores modernos bloquean iframes de otros dominios por seguridad (X-Frame-Options / CSP). Nuestro widget usa la API pública con Leaflet: más rápido, ligero y compatible con todos los navegadores y CMS.',
            'Modern browsers block cross-origin iframes for security (X-Frame-Options / CSP). Our widget uses our public API with Leaflet — faster, lighter, and compatible with all browsers and CMS.'
          )}
        </p>
      </div>

      {/* Vista previa */}
      <a href="/mapa-danos" target="_blank" rel="noopener noreferrer" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 100, borderRadius: 12, textDecoration: 'none', marginBottom: 16,
        border: '2px dashed rgba(111,207,151,0.30)', background: 'rgba(111,207,151,0.04)',
      }}>
        <span style={{ fontSize: 26 }}>🗺️</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6FCF97' }}>{t('Ver mapa en vivo →', 'View live map →')}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>statusvzla.com/mapa-danos</span>
      </a>

      {/* Pasos */}
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
        {t('Cómo integrarlo', 'How to integrate')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
        {[
          t('Copia el código completo de abajo.', 'Copy the full code below.'),
          t('Pégalo en el HTML de tu página, donde quieres el mapa.', 'Paste it in your page HTML where you want the map.'),
          t('El mapa carga automáticamente con datos en tiempo real de nuestra API.', 'The map loads automatically with real-time data from our API.'),
          t('Puedes cambiar height:400px a la altura que necesites.', 'You can change height:400px to any height you need.'),
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2471A3', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>{step}</p>
          </div>
        ))}
      </div>

      <CodeBlock code={SNIPPET_MAPA} label={t('Copiar código', 'Copy code')} labelOk={t('¡Copiado!', 'Copied!')} />
      <AttributionNote t={t} />

      {/* CTA */}
      <div style={{ marginTop: 14, borderRadius: 12, padding: '14px 16px', background: 'rgba(36,113,163,0.08)', border: '1px solid rgba(59,130,246,0.20)' }}>
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
  );
}
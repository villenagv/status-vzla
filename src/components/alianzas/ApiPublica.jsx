import { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import SectionHeader from './SectionHeader';

const API_BASE = 'https://statusvzla.com/functions/apiMapa';
const ENDPOINTS = [
  { key: 'json',    url: `${API_BASE}`,                              desc: { es: 'Edificios + refugios (JSON completo)',         en: 'Buildings + shelters (full JSON)' } },
  { key: 'geojson', url: `${API_BASE}?format=geojson`,               desc: { es: 'GeoJSON — Leaflet, QGIS, Mapbox',             en: 'GeoJSON — Leaflet, QGIS, Mapbox' } },
  { key: 'list',    url: `${API_BASE}?format=list`,                  desc: { es: 'Lista plana (nombre, ciudad, nivel de daño)', en: 'Flat list (name, city, damage level)' } },
  { key: 'ciudad',  url: `${API_BASE}?format=list&ciudad=Caracas`,   desc: { es: 'Filtrar por ciudad',                         en: 'Filter by city' } },
  { key: 'nivel',   url: `${API_BASE}?format=list&nivel=grave`,      desc: { es: 'Filtrar por nivel de daño',                 en: 'Filter by damage level' } },
  { key: 'tipo',    url: `${API_BASE}?format=list&tipo=hospital`,    desc: { es: 'Filtrar por tipo de estructura',            en: 'Filter by structure type' } },
];

const EJEMPLO_JSON = `{
  "ok": true,
  "metadata": { "total": 382, "generated_at": "2025-01-01T12:00:00Z" },
  "edificios": [{
    "id": "abc123",
    "nombre": "Torre Parque Central",
    "nivel_dano": "grave",
    "direccion": "Av. Lecuna",
    "ciudad": "Caracas",
    "estado_region": "Distrito Capital",
    "lat": 10.508, "lng": -66.917,
    "url": "https://statusvzla.com/edificio?id=abc123"
  }]
}`;

const EJEMPLO_GEOJSON = `{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-66.917, 10.508] },
    "properties": {
      "id": "abc123",
      "nombre": "Torre Parque Central",
      "nivel_dano": "grave",
      "ciudad": "Caracas",
      "url": "https://statusvzla.com/edificio?id=abc123"
    }
  }]
}`;

export default function ApiPublica({ t, es }) {
  const [copiadoApi, setCopiadoApi] = useState('');
  const copiar = (url, key) => {
    navigator.clipboard.writeText(url);
    setCopiadoApi(key);
    setTimeout(() => setCopiadoApi(''), 2000);
  };

  return (
    <div>
      <SectionHeader
        icon={<Code size={15} style={{ color: '#A78BFA' }} />}
        title={t('API pública de edificios', 'Public buildings API')}
        desc={t('Acceso directo a nuestros datos. Sin registro. Sin costo. Caché de 90 min. CORS habilitado para llamadas desde el navegador.', 'Direct access to our data. No registration. No cost. 90-min cache. CORS enabled for browser calls.')}
      />

      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        {t('Endpoints disponibles', 'Available endpoints')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {ENDPOINTS.map(ep => (
          <div key={ep.key} style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '0 0 3px' }}>{es ? ep.desc.es : ep.desc.en}</p>
              <code style={{ fontSize: 10, color: '#93C5FD', wordBreak: 'break-all', lineHeight: 1.5, fontFamily: 'monospace' }}>{ep.url}</code>
            </div>
            <button onClick={() => copiar(ep.url, ep.key)} style={{
              flexShrink: 0,
              background: copiadoApi === ep.key ? 'rgba(111,207,151,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copiadoApi === ep.key ? 'rgba(111,207,151,0.40)' : 'rgba(255,255,255,0.10)'}`,
              borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
              color: copiadoApi === ep.key ? '#6FCF97' : 'rgba(255,255,255,0.55)',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
            }}>
              {copiadoApi === ep.key ? <Check size={10} /> : <Copy size={10} />}
              {copiadoApi === ep.key ? 'OK' : t('Copiar', 'Copy')}
            </button>
          </div>
        ))}
      </div>

      {/* Ejemplo JSON */}
      <div style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 10, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.22)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#C4B5FD', margin: '0 0 8px' }}>
          📋 {t('Ejemplo ?format=list (JSON)', 'Sample ?format=list (JSON)')}
        </p>
        <pre style={{ fontSize: 10, color: '#DDD6FE', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{EJEMPLO_JSON}</pre>
      </div>

      {/* Ejemplo GeoJSON */}
      <div style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 12, background: 'rgba(36,113,163,0.07)', border: '1px solid rgba(59,130,246,0.20)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', margin: '0 0 8px' }}>
          🗺️ {t('Ejemplo ?format=geojson', 'Sample ?format=geojson')}
        </p>
        <pre style={{ fontSize: 10, color: '#BAE6FD', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{EJEMPLO_GEOJSON}</pre>
      </div>

      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>
        ℹ️ {t('Los datos se actualizan con cada reporte ciudadano. El caché se refresca automáticamente cada 90 minutos.', 'Data updates with each citizen report. Cache auto-refreshes every 90 minutes.')}
      </p>
    </div>
  );
}
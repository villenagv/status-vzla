import { useState } from 'react';
import { Loader2, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GeocodificarPanel() {
  const [estado, setEstado] = useState('idle'); // idle | corriendo | listo | error
  const [resultado, setResultado] = useState(null);
  const [limite, setLimite] = useState(100);

  const ejecutar = async () => {
    setEstado('corriendo');
    setResultado(null);
    try {
      const res = await base44.functions.invoke('geocodificarEdificios', { limite });
      setResultado(res.data);
      setEstado('listo');
    } catch (err) {
      setResultado({ error: err.message });
      setEstado('error');
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MapPin size={18} color="#2563EB" />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
            Geocodificar registros sin coordenadas
          </h3>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.5 }}>
            Lee los reportes de ReportesDano que no tienen lat/lng y los geocodifica usando <strong>Nominatim / OpenStreetMap</strong>. Respeta el límite de 1 llamada por segundo.
          </p>
        </div>
      </div>

      <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: '#713F12', margin: 0, lineHeight: 1.5 }}>
          ⚠️ <strong>Proceso lento:</strong> Cada registro tarda ~1.1 seg. 100 registros ≈ 2 minutos. No cierres esta pestaña mientras se ejecuta.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#374151', fontWeight: 500, flexShrink: 0 }}>
          Límite de registros por ejecución:
        </label>
        <select value={limite} onChange={e => setLimite(Number(e.target.value))}
          style={{ border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#111827', background: '#fff', cursor: 'pointer' }}>
          <option value={50}>50 registros (~1 min)</option>
          <option value={100}>100 registros (~2 min)</option>
          <option value={200}>200 registros (~4 min)</option>
          <option value={500}>500 registros (~10 min)</option>
        </select>
      </div>

      <button
        onClick={ejecutar}
        disabled={estado === 'corriendo'}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: estado === 'corriendo' ? '#93C5FD' : '#1D4ED8',
          color: '#fff', border: 'none', cursor: estado === 'corriendo' ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {estado === 'corriendo'
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Geocodificando... (esto puede tardar varios minutos)</>
          : <><MapPin size={16} /> Geocodificar registros sin coordenadas</>
        }
      </button>

      {estado === 'listo' && resultado && !resultado.error && (
        <div style={{ marginTop: 14, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803D', margin: 0 }}>
                ✅ {resultado.mensaje}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                {[
                  { label: 'Procesados', val: resultado.procesados, color: '#2563EB' },
                  { label: 'Exitosos', val: resultado.exitosos, color: '#16A34A' },
                  { label: 'Fallidos', val: resultado.fallidos, color: '#DC2626' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</p>
                    <p style={{ fontSize: 10, color: '#6B7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {resultado.errores?.length > 0 && (
                <p style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>
                  Primeros errores: {resultado.errores.slice(0, 3).map(e => e.ciudad || e.id).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {estado === 'error' && (
        <div style={{ marginTop: 14, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
          <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#991B1B', margin: 0 }}>
            Error: {resultado?.error || 'Error desconocido'}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
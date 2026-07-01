import { CheckCircle } from 'lucide-react';
import StatCard from './StatCard';
import LogRow from './LogRow';

export default function ResultadoFinal({ resumen, resultados, logExpandido, setLogExpandido, fotosSubidas, errMsg, reset }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <StatCard icon="✅" label="Completos" val={resumen.ok} color="#16a34a" />
        <StatCard icon="⚠️" label="Parciales" val={resumen.parcial} color="#d97706" />
        <StatCard icon="❌" label="Errores" val={resumen.errors} color="#dc2626" />
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#15803d', margin: 0 }}>✅ Carga completada</p>
          <p style={{ fontSize: 12, color: '#166534', margin: '4px 0 0' }}>
            {resumen.ok} edificios completos, {resumen.parcial} parciales, {resumen.errors} con errores. Total: {resumen.total} edificios — {fotosSubidas.length} fotos subidas.
          </p>
          {errMsg && <p style={{ fontSize: 11, color: '#dc2626', margin: '6px 0 0' }}>⚠️ {errMsg}</p>}
        </div>
      </div>

      {resultados.length > 0 && (
        <div>
          <button onClick={() => setLogExpandido(v => !v)}
            style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              📋 Ver detalle por edificio ({resultados.length})
            </span>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>{logExpandido ? '▲' : '▼'}</span>
          </button>
          {logExpandido && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto' }}>
              {resultados.map((r, i) => <LogRow key={i} item={r} />)}
            </div>
          )}
        </div>
      )}

      <button onClick={reset} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
        Procesar otro archivo
      </button>
    </div>
  );
}
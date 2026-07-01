export default function LogRow({ item }) {
  return (
    <div style={{
      background: item.status === 'ok' ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${item.status === 'ok' ? '#bbf7d0' : '#fecaca'}`,
      borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.nombre_edificio || item.edificio_id}
        </p>
        <p style={{ fontSize: 9, color: '#6b7280', margin: '2px 0 0' }}>
          🏗️ {item.edificio_id?.slice(0, 12)}…
          {item.nuevas > 0 && <span style={{ color: '#2563eb' }}> · {item.nuevas} fotos</span>}
          {item.total_fotos > 0 && <span style={{ color: '#16a34a' }}> · {item.total_fotos} total</span>}
        </p>
        {item.status !== 'ok' && <p style={{ fontSize: 9, color: '#dc2626', margin: '2px 0 0' }}>{item.error}</p>}
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
        background: item.status === 'ok' ? '#dcfce7' : '#fee2e2',
        color: item.status === 'ok' ? '#15803d' : '#dc2626',
      }}>
        {item.status === 'ok' ? '✅ OK' : item.status === 'pendiente' ? '⏳' : '❌ Error'}
      </span>
    </div>
  );
}
export default function StatCard({ icon, label, val, color }) {
  return (
    <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: color || '#111827', margin: 0 }}>{val}</p>
      <p style={{ fontSize: 10, color: '#6b7280', margin: '4px 0 0' }}>{icon} {label}</p>
    </div>
  );
}
export default function SectionHeader({ icon, title, desc }) {
  return (
    <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)', background: '#111318' }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {icon}
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>{title}</span>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}
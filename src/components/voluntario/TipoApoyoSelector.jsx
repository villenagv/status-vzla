const OPCIONES = [
  { val: 'revision_digital',      icon: '💻', es: 'Revisión digital',        en: 'Digital review' },
  { val: 'inspeccion_presencial', icon: '📸', es: 'Inspección presencial',   en: 'On-site inspection' },
  { val: 'coordinacion',          icon: '🧭', es: 'Coordinación',            en: 'Coordination' },
  { val: 'carga_informacion',     icon: '📤', es: 'Carga de información',    en: 'Data upload' },
  { val: 'apoyo_comunitario',     icon: '🤝', es: 'Apoyo comunitario',       en: 'Community support' },
  { val: 'apoyo_administrativo',  icon: '📋', es: 'Apoyo administrativo',    en: 'Administrative support' },
];

// Selector múltiple de tipos de apoyo que puede ofrecer el voluntario/profesional.
export default function TipoApoyoSelector({ value = [], onChange, es }) {
  const toggle = (val) => {
    onChange(value.includes(val) ? value.filter(v => v !== val) : [...value, val]);
  };

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        {es ? '¿Cómo puedes apoyar? (elige una o más)' : 'How can you help? (choose one or more)'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPCIONES.map(op => {
          const activo = value.includes(op.val);
          return (
            <button key={op.val} type="button" onClick={() => toggle(op.val)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${activo ? '#4A9EDB' : 'rgba(255,255,255,0.12)'}`,
                background: activo ? 'rgba(74,158,219,0.14)' : 'rgba(255,255,255,0.06)',
              }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{op.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: activo ? '#93C5FD' : '#fff' }}>
                {es ? op.es : op.en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default function EstadoBadge({ estado }) {
  const map = {
    abierto:       { label: '✅ Abierto',      bg: 'bg-green-100',   text: 'text-green-800'  },
    saturado:      { label: '⚠️ Saturado',     bg: 'bg-orange-100',  text: 'text-orange-800' },
    cerrado:       { label: '🔒 Cerrado',       bg: 'bg-gray-100',    text: 'text-gray-700'   },
    no_verificado: { label: '⚫ No verificado', bg: 'bg-gray-100',    text: 'text-gray-600'   },
    comunidad:     { label: '👥 Comunidad',     bg: 'bg-blue-50',     text: 'text-blue-700'   }
  };
  const s = map[estado] || { label: estado, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5 ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
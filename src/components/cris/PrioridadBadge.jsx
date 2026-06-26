export default function PrioridadBadge({ prioridad, size = 'sm' }) {
  const map = {
    critica: { label: '🔴 CRÍTICO', bg: 'bg-[#F4D5DD]', text: 'text-[#B83A52]', border: 'border-[#B83A52]' },
    alta:    { label: '🟠 ALTO',    bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-400' },
    normal:  { label: '🟡 NORMAL',  bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-400' }
  };
  const s = map[prioridad] || map.normal;
  return (
    <span className={`inline-flex items-center border rounded-full font-semibold ${s.bg} ${s.text} ${s.border} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
      {s.label}
    </span>
  );
}
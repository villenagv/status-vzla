export default function StatMini({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${tones[tone] || tones.blue}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[11px] font-semibold">{label}</p>
    </div>
  );
}
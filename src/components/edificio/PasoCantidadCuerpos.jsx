export default function PasoCantidadCuerpos({ cantidad, setCantidad, onContinuar, t }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        {t('Indica cuántos cuerpos se han recuperado en este edificio. Luego pediremos algunos datos de cada uno, uno por uno.',
           'Indicate how many bodies have been recovered at this building. We will then ask a few details for each one, one at a time.',
           'Indique quantos corpos foram recuperados neste edifício. Depois pediremos alguns dados de cada um, um por um.')}
      </p>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setCantidad(c => Math.max(1, c - 1))}
          className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 text-xl font-bold text-gray-700 cursor-pointer">−</button>
        <span className="text-3xl font-black text-gray-900 w-14 text-center">{cantidad}</span>
        <button onClick={() => setCantidad(c => Math.min(20, c + 1))}
          className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 text-xl font-bold text-gray-700 cursor-pointer">+</button>
      </div>
      <button onClick={onContinuar}
        className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold py-3 rounded-xl cursor-pointer transition-colors">
        {t('Continuar →', 'Continue →', 'Continuar →')}
      </button>
    </div>
  );
}
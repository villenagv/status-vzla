export default function StepPeligro({ form, setVal, es }) {
  const options = [
    { value: 'yes', es: '✅ Sí, estoy en un lugar seguro', en: '✅ Yes, I am in a safe place' },
    { value: 'no', es: '🔴 No, todavía hay peligro', en: '🔴 No, still in danger' },
    { value: 'near_damage', es: '🏚️ Cerca de una estructura dañada', en: '🏚️ Near a damaged structure' },
    { value: 'rubble', es: '🧱 Hay escombros', en: '🧱 There is debris' },
    { value: 'fire_smoke', es: '🔥 Hay fuego o humo', en: '🔥 There is fire or smoke' },
    { value: 'gas_leak', es: '💨 Hay fuga de gas', en: '💨 There is a gas leak' },
    { value: 'fallen_wires', es: '⚡ Hay cables eléctricos caídos', en: '⚡ There are fallen electrical wires' },
    { value: 'flood', es: '🌊 Hay agua, inundación o derrumbe', en: '🌊 There is water, flood or landslide' },
    { value: 'violence', es: '🚨 Hay saqueos, violencia o inseguridad', en: '🚨 There is looting, violence or insecurity' },
    { value: 'unknown', es: '❓ No sé si es seguro', en: '❓ Not sure if it is safe' },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
      <p className="text-xs text-gray-500 mb-1">{es ? 'Elige una opción' : 'Choose one option'}</p>
      {options.map(o => {
        const active = form.lugar_seguro === o.value;
        const critical = ['no', 'fire_smoke', 'gas_leak'].includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => setVal('lugar_seguro', o.value)}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold border-2 text-left cursor-pointer transition-colors ${
              active ? (critical ? 'bg-red-600 text-white border-red-600' : 'bg-gray-900 text-white border-gray-900')
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
            }`}>
            {es ? o.es : o.en}
          </button>
        );
      })}
      {(form.lugar_seguro && form.lugar_seguro !== 'yes') && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
          ⚠️ {es
            ? 'Si el lugar no es seguro, aléjate si puedes hacerlo sin ponerte en más riesgo. Busca un espacio abierto o un punto de ayuda cercano.'
            : 'If the place is not safe, move away if you can do so without more risk. Look for open space or a nearby help center.'}
        </div>
      )}
    </div>
  );
}
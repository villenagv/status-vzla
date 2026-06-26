export default function StepNecesidad({ form, setVal, es }) {
  const opts = [
    { val: 'agua', es: '💧 Agua', en: '💧 Water' },
    { val: 'comida', es: '🍞 Comida', en: '🍞 Food' },
    { val: 'medicinas', es: '💊 Medicinas', en: '💊 Medicine' },
    { val: 'atencion_medica', es: '🏥 Atencion medica', en: '🏥 Medical care' },
    { val: 'traslado', es: '🚗 Traslado', en: '🚗 Transport' },
    { val: 'refugio', es: '🏠 Refugio', en: '🏠 Shelter' },
    { val: 'ropa', es: '👕 Ropa / abrigo', en: '👕 Clothes' },
    { val: 'cargar', es: '🔋 Cargar telefono', en: '🔋 Charge phone' },
    { val: 'contactar_familia', es: '📞 Contactar a mi familia', en: '📞 Contact my family' },
    { val: 'ninos', es: '👶 Ayuda para ninos', en: '👶 Help for children' },
    { val: 'adultos_mayores', es: '👴 Ayuda para adulto mayor', en: '👴 Help for elderly' },
    { val: 'discapacidad', es: '♿ Ayuda para persona con discapacidad', en: '♿ Help for disabled' },
    { val: 'insulina', es: '💉 Insulina / tratamiento medico', en: '💉 Insulin / medical treatment', urg: true },
    { val: 'oxigeno', es: '🫁 Oxigeno / respirador', en: '🫁 Oxygen / ventilator', urg: true },
    { val: 'silla_ruedas', es: '♿ Silla de ruedas / movilidad', en: '♿ Wheelchair' },
    { val: 'higiene', es: '🧻 Articulos de higiene', en: '🧻 Hygiene products' },
    { val: 'paniales', es: '👶 Panales', en: '👶 Diapers' },
    { val: 'comida_bebe', es: '🍼 Comida para bebe', en: '🍼 Baby food' },
    { val: 'mascotas', es: '🐾 Mascotas / comida', en: '🐾 Pets / pet food' },
    { val: 'ninguna', es: '✅ No necesito nada por ahora', en: '✅ Nothing for now' },
  ];

  const toggle = (val) => {
    const current = form.necesidades || [];
    const next = val === 'ninguna' ? [] : (current.includes(val) ? current.filter(v => v !== val) : [...current.filter(v => v !== 'ninguna'), val]);
    setVal('necesidades', next);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{es ? '¿Que necesitas ahora?' : 'What do you need now?'}</h3>
      <p className="text-xs text-gray-500 mb-2">{es ? 'Puedes elegir varias' : 'You can choose multiple'}</p>
      <div className="grid grid-cols-2 gap-2">
        {opts.map(o => {
          const active = (form.necesidades || []).includes(o.val);
          return (
            <button key={o.val} type="button" onClick={() => toggle(o.val)}
              className={`py-2.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                active ? (o.urg ? 'bg-red-600 text-white border-red-600' : 'bg-amber-600 text-white border-amber-600')
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
              style={o.urg && active ? {} : {}}>
              {es ? o.es : o.en}
            </button>
          );
        })}
      </div>
      {(form.necesidades || []).some(n => ['insulina', 'oxigeno'].includes(n)) && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700 font-semibold">
          🚨 {es ? 'Esta necesidad es URGENTE — se marcara como prioritaria.' : 'This need is URGENT — it will be marked as priority.'}
        </div>
      )}
    </div>
  );
}
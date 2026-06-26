export default function StepCentro({ form, setVal, es }) {
  const opts = [
    { val: 'hospital', es: '🏥 Hospital', en: '🏥 Hospital' },
    { val: 'cdi', es: '🏛️ CDI / Ambulatorio', en: '🏛️ Clinic' },
    { val: 'refugio', es: '🏕️ Refugio', en: '🏕️ Shelter' },
    { val: 'escuela', es: '🏫 Escuela / Liceo', en: '🏫 School' },
    { val: 'iglesia', es: '⛪ Iglesia', en: '⛪ Church' },
    { val: 'cancha', es: '🏟️ Cancha / Plaza', en: '🏟️ Sports field / Plaza' },
    { val: 'proteccion_civil', es: '🦺 Proteccion Civil', en: '🦺 Civil Protection' },
    { val: 'casa_familiar', es: '🏠 Casa de familiar', en: '🏠 Relative\'s house' },
    { val: 'casa_vecino', es: '🏠 Casa de vecino', en: '🏠 Neighbor\'s house' },
    { val: 'sin_centro', es: '❌ No estoy en un centro', en: '❌ Not in a center' },
  ];

  return (
    <div className="space-y-3">
      {/* Última ubicación antes */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
          📍 {es ? '¿Donde estabas cuando ocurrio el terremoto?' : 'Where were you when the earthquake happened?'}
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[
            { val: 'casa', es: '🏠 Casa', en: '🏠 Home' },
            { val: 'trabajo', es: '💼 Trabajo', en: '💼 Work' },
            { val: 'escuela', es: '🏫 Escuela', en: '🏫 School' },
            { val: 'calle', es: '🛣️ Calle', en: '🛣️ Street' },
            { val: 'edificio', es: '🏢 Edificio', en: '🏢 Building' },
            { val: 'hospital', es: '🏥 Hospital', en: '🏥 Hospital' },
            { val: 'transporte', es: '🚗 Transporte', en: '🚗 Transport' },
            { val: 'no_recuerdo', es: '❓ No recuerdo', en: '❓ Don\'t recall' },
          ].map(o => (
            <button key={o.val} type="button" onClick={() => setVal('ubicacion_antes_tipo', form.ubicacion_antes_tipo === o.val ? '' : o.val)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${form.ubicacion_antes_tipo === o.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">{es ? 'O escribe la direccion o zona:' : 'Or write the address or area:'}</label>
          <input value={form.ubicacion_antes || ''} onChange={e => setVal('ubicacion_antes', e.target.value)}
            placeholder={es ? 'Ultima ubicacion conocida antes de llegar aqui...' : 'Last known location before arriving here...'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        </div>
      </div>

      {/* Centro de apoyo */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          🏠 {es ? '¿Estas en algun centro de apoyo?' : 'Are you in a support center?'}
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {opts.map(o => (
            <button key={o.val} type="button" onClick={() => setVal('centro_tipo', form.centro_tipo === o.val ? '' : o.val)}
              className={`py-2.5 rounded-lg text-xs font-semibold border cursor-pointer ${form.centro_tipo === o.val ? 'bg-green-700 text-white border-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
        {form.centro_tipo && form.centro_tipo !== 'sin_centro' && (
          <>
            <input value={form.centro_nombre || ''} onChange={e => setVal('centro_nombre', e.target.value)}
              placeholder={es ? 'Nombre del lugar, si lo sabes...' : 'Name of the place, if known...'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{es ? 'Donde estamos ahora:' : 'Where we are now:'}</label>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.ciudad || ''} onChange={e => setVal('ciudad', e.target.value)} placeholder={es ? 'Ciudad' : 'City'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
                <input value={form.estado || ''} onChange={e => setVal('estado', e.target.value)} placeholder={es ? 'Estado' : 'State'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
              </div>
              <input value={form.ubicacion || ''} onChange={e => setVal('ubicacion', e.target.value)}
                placeholder={es ? 'Referencia: cerca de, frente a...' : 'Reference: near, next to...'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900 mt-2" />
            </div>
          </>
        )}
      </div>

      {/* Traslado */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          🚗 {es ? '¿Te trasladaron desde otro lugar?' : 'Were you moved from another place?'}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 'si', es: 'Si', en: 'Yes' },
            { val: 'no', es: 'No', en: 'No' },
            { val: 'no_sabe', es: 'No se', en: 'Don\'t know' },
          ].map(o => (
            <button key={o.val} type="button" onClick={() => setVal('trasladado', form.trasladado === o.val ? '' : o.val)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${form.trasladado === o.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
        {form.trasladado === 'si' && (
          <>
            <input value={form.trasladado_desde || ''} onChange={e => setVal('trasladado_desde', e.target.value)} placeholder={es ? '¿Desde donde?' : 'From where?'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
            <p className="text-xs font-semibold text-gray-600 mt-1">{es ? '¿Quien te traslado?' : 'Who moved you?'}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { val: 'vecinos', es: 'Vecinos', en: 'Neighbors' },
                { val: 'bomberos', es: 'Bomberos', en: 'Firefighters' },
                { val: 'proteccion_civil', es: 'Proteccion Civil', en: 'Civil Protection' },
                { val: 'ambulancia', es: 'Ambulancia', en: 'Ambulance' },
                { val: 'particular', es: 'Vehiculo particular', en: 'Private vehicle' },
                { val: 'no_sabe', es: 'No se', en: 'Don\'t know' },
              ].map(o => (
                <button key={o.val} type="button" onClick={() => setVal('trasladado_por', form.trasladado_por === o.val ? '' : o.val)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${form.trasladado_por === o.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {es ? o.es : o.en}
                </button>
              ))}
            </div>
            <input value={form.trasladado_hora || ''} onChange={e => setVal('trasladado_hora', e.target.value)} placeholder={es ? 'Hora aproximada' : 'Approximate time'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          </>
        )}
      </div>
    </div>
  );
}
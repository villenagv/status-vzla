export default function StepPrivacidad({ form, setVal, toggleArr, es }) {
  const CONDICIONES = [
    { val: 'diabetes', es: 'Diabetes', en: 'Diabetes', priv: true },
    { val: 'hipertension', es: 'Hipertension', en: 'Hypertension', priv: true },
    { val: 'embarazo', es: 'Embarazo', en: 'Pregnancy', priv: true },
    { val: 'asma', es: 'Asma', en: 'Asthma', priv: true },
    { val: 'dialisis', es: 'Dialisis', en: 'Dialysis', priv: true },
    { val: 'cardiaco', es: 'Tratamiento cardiaco', en: 'Heart treatment', priv: true },
    { val: 'discapacidad_fisica', es: 'Discapacidad fisica', en: 'Physical disability' },
    { val: 'discapacidad_auditiva', es: 'Discapacidad auditiva', en: 'Hearing disability' },
    { val: 'discapacidad_visual', es: 'Discapacidad visual', en: 'Visual disability' },
    { val: 'medicamento_diario', es: 'Necesita medicamento diario', en: 'Needs daily medication', priv: true },
    { val: 'alergia_grave', es: 'Alergia grave', en: 'Severe allergy', priv: true },
    { val: 'ninguna', es: 'Ninguna', en: 'None' },
  ];

  return (
    <div className="space-y-4">
      {/* Batería y señal */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">🔋 {es ? '¿Tienes bateria o senal?' : 'Do you have battery or signal?'}</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { val: 'ok', es: '✅ Si, tengo ambas', en: '✅ Yes, both' },
            { val: 'poca_bateria', es: '🔴 Poca bateria', en: '🔴 Low battery' },
            { val: 'senal_intermitente', es: '📶 Senal intermitente', en: '📶 Intermittent signal' },
            { val: 'sin_senal', es: '❌ No tengo senal', en: '❌ No signal' },
            { val: 'prestado', es: '📱 Telefono prestado', en: '📱 Borrowed phone' },
            { val: 'una_vez', es: '⏳ Solo puedo enviar esto una vez', en: '⏳ Can only send this once' },
          ].map(o => (
            <button key={o.val} type="button" onClick={() => setVal('bateria_senal', form.bateria_senal === o.val ? '' : o.val)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${form.bateria_senal === o.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
        {['poca_bateria', 'una_vez'].includes(form.bateria_senal) && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
            ⚡ {es
              ? 'Guarda tu codigo CRIS o toma una captura de pantalla. Cierra apps que no uses y prioriza mensajes cortos.'
              : 'Save your CRIS code or take a screenshot. Close unused apps and prioritize short messages.'}
          </div>
        )}
      </div>

      {/* Comunicación */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">🌐 {es ? '¿Como te comunicas mejor?' : 'How do you communicate best?'}</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { val: 'llamada', es: '📞 Llamada', en: '📞 Call' },
            { val: 'whatsapp', es: '💬 WhatsApp', en: '💬 WhatsApp' },
            { val: 'mensajes', es: '✉️ Mensajes de texto', en: '✉️ Text messages' },
            { val: 'solo_recibir', es: '📩 Solo puedo recibir', en: '📩 Can only receive' },
            { val: 'sin_senal', es: '📡 No tengo senal', en: '📡 No signal' },
            { val: 'interprete', es: '🫸 Necesito interprete', en: '🫸 Need interpreter' },
            { val: 'senas', es: '🤟 Lengua de senas', en: '🤟 Sign language' },
          ].map(o => (
            <button key={o.val} type="button" onClick={() => setVal('comunicacion', form.comunicacion === o.val ? '' : o.val)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${form.comunicacion === o.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
      </div>

      {/* Condiciones médicas */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          💊 {es ? 'Condiciones medicas importantes' : 'Important medical conditions'}
          <span className="text-[10px] font-normal text-gray-400">🔒 {es ? 'Privado' : 'Private'}</span>
        </h3>
        <p className="text-xs text-gray-500 mb-1">{es ? 'Para que rescatistas e instituciones te atiendan mejor:' : 'So rescue teams can better assist you:'}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {CONDICIONES.map(c => (
            <button key={c.val} type="button" onClick={() => toggleArr('condiciones_medicas', c.val)}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${(form.condiciones_medicas || []).includes(c.val) ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
              {es ? c.es : c.en}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">{es ? 'Medicamento urgente o condicion especial:' : 'Urgent medication or special condition:'}</label>
          <input value={form.medicamento_urgente || ''} onChange={e => setVal('medicamento_urgente', e.target.value)}
            placeholder={es ? 'Ej: Necesito insulina cada 6 horas' : 'E.g: Need insulin every 6 hours'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600">
          🔒 {es ? 'Esta informacion es PRIVADA. Solo la veran rescatistas e instituciones verificadas (hospital, proteccion civil, bomberos).' : 'This info is PRIVATE. Only verified institutions can see it.'}
        </div>
      </div>

      {/* Permisos de privacidad */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          🛡️ {es ? '¿Que permites compartir?' : 'What do you allow to share?'}
        </h3>
        {[
          { val: 'mostrar_vivo', es: 'Mostrar que estoy vivo/a', en: 'Show that I am alive' },
          { val: 'mostrar_nombre', es: 'Mostrar mi nombre', en: 'Show my name' },
          { val: 'mostrar_ubicacion', es: 'Mostrar ubicacion aproximada', en: 'Show approximate location' },
          { val: 'compartir_familia', es: 'Compartir con familiares', en: 'Share with family' },
          { val: 'compartir_instituciones', es: 'Compartir con instituciones', en: 'Share with institutions' },
          { val: 'no_exacta', es: 'No mostrar ubicacion exacta', en: 'Don\'t show exact location' },
          { val: 'limitar', es: 'Solo info limitada (por defecto)', en: 'Only limited info (default)' },
        ].map(o => (
          <label key={o.val} className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input type="checkbox" checked={(form.permisos || []).includes(o.val)} onChange={() => toggleArr('permisos', o.val)} className="rounded border-gray-300 w-4 h-4 flex-shrink-0" />
            <span className="text-xs text-gray-700">{es ? o.es : o.en}</span>
          </label>
        ))}
        <p className="text-xs text-gray-400 mt-1">{es ? 'Por defecto se mostrara: nombre parcial + estado general + zona aproximada.' : 'Default: partial name + general status + approximate area.'}</p>
      </div>

      {/* Nombre del reportante */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <label className="text-xs font-medium text-gray-600 block mb-1">{es ? 'Tu nombre (opcional, para identificarte):' : 'Your name (optional):'}</label>
        <input value={form.nombre || ''} onChange={e => setVal('nombre', e.target.value)}
          placeholder={es ? 'Ej: Maria Garcia' : 'E.g: Maria Garcia'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
      </div>
    </div>
  );
}
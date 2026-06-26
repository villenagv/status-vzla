export default function StepFamilia({ form, setVal, es }) {
  return (
    <div className="space-y-4">
      {/* Mensaje rápido */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          💬 {es ? 'Mensaje rápido para tu familia' : 'Quick message for your family'}
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { es: 'Estoy vivo/a y estoy en...', en: 'I am alive and I am in...' },
            { es: 'No tengo senal constante, pero estoy bien', en: 'No constant signal, but I am OK' },
            { es: 'Me trasladaron desde... hacia...', en: 'I was moved from... to...' },
            { es: 'Estoy en un refugio/hospital', en: 'I am in a shelter/hospital' },
            { es: 'Necesito que contacten a...', en: 'I need someone to contact...' },
          ].map((m, i) => (
            <button key={i} type="button" onClick={() => setVal('mensaje_rápido', es ? m.es : m.en)}
              className={`text-xs text-left py-2 px-3 rounded-lg border cursor-pointer transition-colors ${form.mensaje_rápido === (es ? m.es : m.en) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              ✏️ {es ? m.es : m.en}
            </button>
          ))}
        </div>
        <textarea rows={2} value={form.mensaje_rápido || ''} onChange={e => setVal('mensaje_rápido', e.target.value)}
          placeholder={es ? 'O escribe tu propio mensaje...' : 'Or write your own message...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900 resize-none mt-2" />
      </div>

      {/* Busca familiar desde la zona */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          🔍 {es ? '¿Estas buscando a alguien de tu familia?' : 'Are you looking for a family member?'}
        </h3>
        <p className="text-xs text-gray-500">{es ? '(Opcional)' : '(Optional)'}</p>
        <input value={form.busca_familiar_nombre || ''} onChange={e => setVal('busca_familiar_nombre', e.target.value)}
          placeholder={es ? 'Nombre de la persona que buscas...' : 'Name of the person you are looking for...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.busca_familiar_relacion || ''} onChange={e => setVal('busca_familiar_relacion', e.target.value)} placeholder={es ? 'Relacion' : 'Relationship'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          <input value={form.busca_familiar_ubicacion || ''} onChange={e => setVal('busca_familiar_ubicacion', e.target.value)} placeholder={es ? 'Donde podria estar' : 'Where they might be'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        </div>
      </div>

      {/* Persona a quien quiere avisar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          📞 {es ? '¿A quien quieres que avisemos?' : 'Who should we notify?'}
          <span className="text-[10px] font-normal text-gray-400">🔒 {es ? 'Privado' : 'Private'}</span>
        </h3>
        <input value={form.avisar_nombre || ''} onChange={e => setVal('avisar_nombre', e.target.value)}
          placeholder={es ? 'Nombre del familiar...' : 'Name of family member...'}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.avisar_relacion || ''} onChange={e => setVal('avisar_relacion', e.target.value)} placeholder={es ? 'Relacion' : 'Relationship'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          <input value={form.avisar_contacto || ''} onChange={e => setVal('avisar_contacto', e.target.value)} placeholder={es ? 'Telefono / WhatsApp' : 'Phone / WhatsApp'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">{es ? 'Mensaje corto:' : 'Short message:'}</label>
          <input value={form.avisar_mensaje || ''} onChange={e => setVal('avisar_mensaje', e.target.value)}
            placeholder={es ? 'Avisenle a mi mama que estoy vivo y estoy en...' : 'Tell my mom I am alive and I am in...'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600">
          🔒 {es ? 'Esta informacion es PRIVADA. Solo la veran rescatistas e instituciones verificadas.' : 'This information is PRIVATE. Only rescue teams and verified institutions will see it.'}
        </div>
      </div>
    </div>
  );
}
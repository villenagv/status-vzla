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
            { es: 'Estoy bien y estoy en...', en: 'I\'m OK and I\'m in...' },
            { es: 'Se me va la señal, pero estoy bien', en: 'Signal keeps dropping but I\'m alright' },
            { es: 'Me llevaron de... hacia...', en: 'I was taken from... to...' },
            { es: 'Estoy en un refugio u hospital', en: 'I\'m at a shelter or hospital' },
            { es: 'Necesito que localicen a...', en: 'Need someone to find...' },
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
          <label className="text-xs font-medium text-gray-600 mb-1 block">{es ? 'Correo electrónico:' : 'Email address:'}</label>
          <input type="email" value={form.avisar_email || ''} onChange={e => setVal('avisar_email', e.target.value)}
            placeholder={es ? 'Correo al que enviaremos el aviso...' : 'Email to send the notice to...'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 leading-relaxed">
            📨 {es ? 'El aviso se envía automáticamente al correo que indiques, esté o no registrado en la plataforma.'
              : 'The notice is sent automatically to the email you indicate, whether or not they are registered on the platform.'}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">{es ? 'Mensaje corto:' : 'Short message:'}</label>
          <input value={form.avisar_mensaje || ''} onChange={e => setVal('avisar_mensaje', e.target.value)}
            placeholder={es ? 'Avisenle a mi mama que estoy vivo y estoy en...' : 'Tell my mom I am alive and I am in...'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600">
          🔒 {es ? 'Esta informacion es PRIVADA. Solo la veran rescatistas e instituciones verificadas. Si das un correo, le enviaremos un aviso automatico.' : 'This information is PRIVATE. Only rescue teams and verified institutions will see it. If you provide an email, we will send an automatic notice.'}
        </div>
      </div>
    </div>
  );
}
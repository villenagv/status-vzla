import { Loader2, Camera, X } from 'lucide-react';

export default function FormularioActualizacionEdificio({
  updateForm, setUpdateForm, updateFotos, setUpdateFotos, subirUpdateFoto,
  handleUpdate, enviando, setEditando, es, t,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">✏️ {t('Tu actualización', 'Your update', 'Sua atualização')}</h2>
        <button onClick={() => setEditando(false)} className="text-xs text-gray-400 underline cursor-pointer">{t('Cancelar', 'Cancel', 'Cancelar')}</button>
      </div>

      {/* Tipo */}
      <div>
        <p className="text-xs font-bold text-gray-600 mb-1.5">{t('¿Qué tipo de actualización es?', 'What type of update?', 'Que tipo de atualização?')} <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { val: 'tengo_actualizacion',          es: '🔄 Tengo info nueva',         en: '🔄 New info'              },
            { val: 'reportar_urgencia',            es: '🚨 Urgencia',                  en: '🚨 Emergency'             },
            { val: 'personas_atrapadas',           es: '🆘 Hay atrapados',             en: '🆘 Trapped'               },
            { val: 'persona_herida_recuperada',    es: '🩹 Recuperaron herido',        en: '🩹 Injured recovered'      },
            { val: 'persona_fallecida_recuperada', es: '⚫ Recuperaron fallecido',     en: '⚫ Deceased recovered'     },
            { val: 'riesgo_marcado',               es: '💨 Nuevo riesgo',              en: '💨 New hazard'             },
          ].map(tb => (
            <button key={tb.val} onClick={() => setUpdateForm(f => ({ ...f, tipo: tb.val }))}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors text-left ${updateForm.tipo === tb.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300'}`}>
              {es ? tb.es : tb.en}
            </button>
          ))}
        </div>
      </div>

      {/* Nivel daño */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('Nivel de daño actual (si cambió)', 'Current damage level (if changed)', 'Nível de dano atual (se mudou)')}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[{ val: 'leve', es: '🟡 Leve', en: '🟡 Minor' }, { val: 'moderado', es: '🟠 Moderado', en: '🟠 Moderate' }, { val: 'grave', es: '🔴 Grave', en: '🔴 Severe' }, { val: 'critico', es: '🔴 Crítico', en: '🔴 Critical' }, { val: 'colapsado', es: '💥 Colapsado', en: '💥 Collapsed' }, { val: '', es: '— Sin cambio', en: '— No change' }].map(n => (
            <button key={n.val} onClick={() => setUpdateForm(f => ({ ...f, nivel: n.val }))}
              className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.nivel === n.val ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {es ? n.es : n.en}
            </button>
          ))}
        </div>
      </div>

      {/* Atrapados */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('¿Personas atrapadas?', 'Trapped people?', 'Pessoas presas?')}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[{ val: 'si', es: '🚨 Sí', en: '🚨 Yes' }, { val: 'voces', es: '👂 Voces/golpes', en: '👂 Voices/knocks' }, { val: 'no', es: '✅ No', en: '✅ No' }, { val: 'no_sabe', es: '❓ No sé', en: '❓ Unknown' }].map(a => (
            <button key={a.val} onClick={() => setUpdateForm(f => ({ ...f, atrapados: a.val }))}
              className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.atrapados === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {es ? a.es : a.en}
            </button>
          ))}
        </div>
      </div>

      {/* Acceso a pie */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">🚶 {t('¿Cómo está la calle / acceso a pie?', 'How is the street / foot access?', 'Como está a rua / acesso a pé?')}</p>
        <div className="flex flex-col gap-1.5">
          {[
            { val: 'normal',        es: '✅ Paso libre — sin problemas',          en: '✅ Clear — no issues'            },
            { val: 'dificultad',    es: '⚠️ Se puede pasar, con dificultad',      en: '⚠️ Passable with difficulty'     },
            { val: 'solo_peatonal', es: '🚶 Solo a pie — vehículos no pasan',     en: '🚶 On foot only — no vehicles'   },
            { val: 'bloqueada',     es: '🚫 Calle bloqueada',                     en: '🚫 Blocked — cannot pass'        },
            { val: 'insegura',      es: '☠️ Peligrosa — no intentes pasar',       en: '☠️ Dangerous — do not attempt'   },
          ].map(a => (
            <button key={a.val} onClick={() => setUpdateForm(f => ({ ...f, accesoPie: f.accesoPie === a.val ? '' : a.val }))}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left ${updateForm.accesoPie === a.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {es ? a.es : a.en}
            </button>
          ))}
        </div>
      </div>

      {/* Riesgos */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">⚠️ {t('¿Hay alguno de estos riesgos?', 'Are any of these hazards present?', 'Há algum desses riscos?')}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[{ k: 'gas', icon: '💨', es: 'Olor a gas', en: 'Gas smell' }, { k: 'elect', icon: '⚡', es: 'Cables caídos', en: 'Fallen wires' }, { k: 'inc', icon: '🔥', es: 'Fuego / humo', en: 'Fire / smoke' }].map(r => (
            <button key={r.k} onClick={() => setUpdateForm(f => ({ ...f, [r.k]: !f[r.k] }))}
              className={`py-2.5 px-1 rounded-xl text-xs font-semibold border cursor-pointer text-center ${updateForm[r.k] ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {r.icon} {es ? r.es : r.en}
            </button>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <textarea rows={2} value={updateForm.desc} onChange={e => setUpdateForm(f => ({ ...f, desc: e.target.value }))}
        placeholder={['persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(updateForm.tipo)
          ? t('Describe sin datos sensibles: cuántas personas, quién las recuperó...', 'Describe without sensitive details: how many people, who recovered them...', 'Descreva sem dados sensíveis: quantas pessoas, quem as recuperou...')
          : t('Describe lo que viste o sabes...', 'Describe what you saw or know...', 'Descreva o que você viu ou sabe...')}
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 resize-none placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />

      {/* Datos contacto */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
        <p className="text-xs font-bold text-gray-500">🔒 {t('Tus datos (privados, no se publican)', 'Your info (private, not published)', 'Seus dados (privados, não publicados)')}</p>
        <input value={updateForm.nombre}   onChange={e => setUpdateForm(f => ({ ...f, nombre: e.target.value }))}   placeholder={t('Nombre (opcional)', 'Name (optional)', 'Nome (opcional)')}   className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        <input value={updateForm.telefono} onChange={e => setUpdateForm(f => ({ ...f, telefono: e.target.value }))} placeholder={t('Teléfono / WhatsApp (opcional)', 'Phone / WhatsApp (optional)', 'Telefone / WhatsApp (opcional)')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        <input value={updateForm.contacto} onChange={e => setUpdateForm(f => ({ ...f, contacto: e.target.value }))} placeholder={t('Email (opcional)', 'Email (optional)', 'Email (opcional)')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>

      {/* Fotos */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">📷 {t('Fotos (opcional, desde lugar seguro)', 'Photos (optional, from safe location)', 'Fotos (opcional, de lugar seguro)')}</p>
        <div className="flex flex-wrap gap-2">
          {updateFotos.map(f => (
            <div key={f.id} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              {(f.previewUrl || f.url) && <img src={f.previewUrl || f.url} alt="" className="w-full h-full object-cover" />}
              <button onClick={() => setUpdateFotos(p => p.filter(x => x.id !== f.id))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={8} /></button>
            </div>
          ))}
          {updateFotos.length < 5 && (
            <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50">
              <Camera size={16} className="text-gray-400" />
              <input type="file" accept="image/*" className="hidden" onChange={e => { Array.from(e.target.files || []).slice(0, 5).forEach(subirUpdateFoto); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>

      <button onClick={handleUpdate} disabled={enviando || !updateForm.tipo}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3.5 rounded-2xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 transition-colors">
        {enviando ? <Loader2 className="animate-spin" size={15} /> : '📡'} {t('Enviar actualización', 'Send update', 'Enviar atualização')}
      </button>
      {updateFotos.length > 0 && (
        <p className="text-[10px] text-gray-400 text-center mt-1">
          📷 {t('Las fotos se subirán automáticamente en segundo plano.', 'Photos will upload automatically in the background.', 'As fotos serão enviadas em segundo plano.')}
        </p>
      )}
    </div>
  );
}
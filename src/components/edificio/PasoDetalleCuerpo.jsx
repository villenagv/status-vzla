export default function PasoDetalleCuerpo({ cuerpo, onChange, indice, total, t }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {t(`Cuerpo ${indice + 1} de ${total}`, `Body ${indice + 1} of ${total}`, `Corpo ${indice + 1} de ${total}`)}
      </p>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('Edad aparente', 'Apparent age', 'Idade aparente')}</p>
        <input value={cuerpo.edad_aparente} onChange={e => onChange({ ...cuerpo, edad_aparente: e.target.value })}
          placeholder={t('Ej: 30-40 años, niño, adulto mayor, no sé...', 'E.g.: 30-40 years, child, elderly, unknown...', 'Ex: 30-40 anos, criança, idoso, não sei...')}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-600" />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('Sexo', 'Sex', 'Sexo')}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: 'masculino', es: 'Masculino', en: 'Male' },
            { val: 'femenino', es: 'Femenino', en: 'Female' },
            { val: 'no_se_sabe', es: 'No sé', en: "Don't know" },
          ].map(s => (
            <button key={s.val} onClick={() => onChange({ ...cuerpo, sexo: s.val })}
              className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${cuerpo.sexo === s.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {t(s.es, s.en, s.es)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('Identidad (si se conoce)', 'Identity (if known)', 'Identidade (se conhecida)')}</p>
        <input value={cuerpo.identidad} onChange={e => onChange({ ...cuerpo, identidad: e.target.value })}
          placeholder={t('Nombre, o déjalo vacío si no se sabe', 'Name, or leave blank if unknown', 'Nome, ou deixe em branco se desconhecido')}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-600" />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('¿A dónde será trasladado?', 'Where will the body be taken?', 'Para onde será levado?')}</p>
        <input value={cuerpo.destino_traslado} onChange={e => onChange({ ...cuerpo, destino_traslado: e.target.value })}
          placeholder={t('Ej: Morgue Bello Monte, Hospital, no sé...', 'E.g.: Bello Monte morgue, hospital, unknown...', 'Ex: Necrotério, hospital, não sei...')}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-600" />
      </div>
    </div>
  );
}
import { useLang } from '@/lib/LangContext';

export default function AdvertenciaSeguridadEdificio({ compact = false }) {
  const { lang } = useLang();
  const es = lang === 'es';

  if (compact) {
    return (
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
        <span className="text-lg flex-shrink-0 mt-px">⚠️</span>
        <div>
          <p className="text-xs font-bold text-amber-800 mb-0.5">
            {es ? '🏚️ Seguridad en edificios' : '🏚️ Building safety'}
          </p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            {es
              ? 'No entres a estructuras con grietas graves, colapso, olor a gas o cables caídos. Espera a Protección Civil o Bomberos.'
              : 'Do not enter buildings with major cracks, collapse, gas smell or fallen wires. Wait for Civil Protection or Firefighters.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-6 flex gap-3">
      <span className="text-2xl flex-shrink-0 mt-0.5">🚫</span>
      <div>
        <p className="text-sm font-black text-red-800 mb-1">
          {es ? '⚠️ No entres a estructuras dañadas' : '⚠️ Do not enter damaged structures'}
        </p>
        <p className="text-xs text-red-700 leading-relaxed">
          {es
            ? 'Si hay grietas graves, colapso parcial, olor a gas, cables caídos, incendio o personas atrapadas, espera a Protección Civil, Bomberos, rescatistas o autoridades competentes.'
            : 'If there are major cracks, partial collapse, gas smell, fallen wires, fire, or trapped people, wait for Civil Protection, firefighters, rescue teams, or authorized officials.'}
        </p>
      </div>
    </div>
  );
}
// Checklist visual de las fotos sugeridas para una inspección completa.
// No bloquea el envío — solo guía al inspector para que no le falte evidencia clave.
const DETALLE_EXCLUIDAS = new Set(['fachada', 'general', 'otro_angulo', 'otro', 'pisos']);

const ITEMS = [
  { key: 'fachada',     es: 'Fachada completa',          en: 'Full façade',        test: areas => areas.has('fachada') },
  { key: 'amplia',      es: 'Área amplia del daño',      en: 'Wide damage area',   test: areas => areas.has('general') },
  { key: 'detalle',     es: 'Detalle cercano del daño',  en: 'Close-up of damage', test: areas => [...areas].some(a => !DETALLE_EXCLUIDAS.has(a)) },
  { key: 'piso',        es: 'Piso o zona afectada',      en: 'Affected floor/area', test: areas => areas.has('pisos') },
  { key: 'angulo',      es: 'Otro ángulo',               en: 'Another angle',      test: areas => areas.has('otro_angulo') },
];

export default function ChecklistFotosGuia({ fotos, es }) {
  const areas = new Set(fotos.map(f => f.area));
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
      <p className="text-[11px] font-bold text-blue-800 mb-2">📋 {es ? 'Guía de fotos sugeridas' : 'Suggested photo guide'}</p>
      <div className="grid grid-cols-1 gap-1">
        {ITEMS.map(item => {
          const listo = item.test(areas);
          return (
            <div key={item.key} className="flex items-center gap-2 text-[11px]">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${listo ? 'bg-green-600 text-white' : 'bg-white border border-blue-300 text-blue-300'}`}>
                {listo ? '✓' : ''}
              </span>
              <span className={listo ? 'text-green-700 font-medium' : 'text-blue-700'}>{es ? item.es : item.en}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
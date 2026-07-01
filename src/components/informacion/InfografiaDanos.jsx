import LazyImage from '@/components/svzla/LazyImage';

const NIVELES = [
  { emoji: '🟢', es: 'Leve — estético', en: 'Minor — cosmetic', estructural: false,
    desc_es: 'Grietas pequeñas en pintura o friso. No afecta paredes, columnas ni vigas.',
    desc_en: 'Small cracks in paint or plaster. Does not affect walls, columns or beams.' },
  { emoji: '🟠', es: 'Moderado', en: 'Moderate', estructural: false,
    desc_es: 'Grietas más profundas en paredes de ladrillo o bloque. Vigila si crecen.',
    desc_en: 'Deeper cracks in brick or block walls. Watch if they grow.' },
  { emoji: '🔴', es: 'Grave — estructural', en: 'Severe — structural', estructural: true,
    desc_es: 'Daño en columnas o vigas de concreto, cabillas visibles. Esto SÍ es estructural.',
    desc_en: 'Damage to concrete columns or beams, visible rebar. This IS structural.' },
  { emoji: '💜', es: 'Colapsado', en: 'Collapsed', estructural: true,
    desc_es: 'Parte o toda la estructura se derrumbó. Zona de rescate.',
    desc_en: 'Part or all of the structure has come down. Rescue zone.' },
];

export default function InfografiaDanos({ es }) {
  const t = (esStr, enStr) => es ? esStr : enStr;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        {t('Guía visual', 'Visual guide')}
      </p>
      <h2 className="text-base font-black text-gray-900 mb-3">
        📸 {t('Cómo tomar las fotos del edificio', 'How to take the building photos')}
      </h2>
      <LazyImage
        src="https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/9a30003ee_Infografiainstruccionesfotos.png"
        alt={t('Instrucciones de fotos: fachada, daño en estructura, daño de cerca', 'Photo instructions: facade, structural damage, close-up damage')}
        className="w-full rounded-xl mb-2"
        style={{ aspectRatio: '4/3' }}
      />
      <p className="text-xs text-gray-600 leading-relaxed">
        {t(
          'Toma 3 fotos: (1) la fachada completa del edificio, (2) el daño en la pared o estructura, y (3) un acercamiento de la grieta o daño. Esto ayuda a los voluntarios técnicos a evaluar tu reporte más rápido.',
          'Take 3 photos: (1) the full building facade, (2) the damage on the wall or structure, and (3) a close-up of the crack or damage. This helps technical volunteers assess your report faster.'
        )}
      </p>

      <div className="border-t border-gray-100 my-4" />

      <h2 className="text-base font-black text-gray-900 mb-1">
        🚦 {t('Qué es daño estructural y qué no', 'What is structural damage and what is not')}
      </h2>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        {t(
          'El daño estructural afecta las columnas, vigas o el concreto que sostiene el edificio. El daño estético solo afecta pintura, friso o paredes que no sostienen peso.',
          'Structural damage affects the columns, beams, or concrete that hold up the building. Cosmetic damage only affects paint, plaster, or non-load-bearing walls.'
        )}
      </p>
      <LazyImage
        src="https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/94dfe895c_Infografiaestadodeledificio.png"
        alt={t('Niveles de daño: leve, moderado, grave, colapsado', 'Damage levels: minor, moderate, severe, collapsed')}
        className="w-full rounded-xl mb-3"
        style={{ aspectRatio: '16/10' }}
      />

      <div className="space-y-2">
        {NIVELES.map((n, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: n.estructural ? '#FDEDEC' : '#F9FAFB' }}>
            <span className="text-lg flex-shrink-0">{n.emoji}</span>
            <div>
              <p className="text-xs font-black text-gray-800">
                {es ? n.es : n.en} {n.estructural && <span className="text-red-600">· {t('NO ENTRAR', 'DO NOT ENTER')}</span>}
              </p>
              <p className="text-[11px] text-gray-500 leading-snug">{es ? n.desc_es : n.desc_en}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
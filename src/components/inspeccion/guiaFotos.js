/**
 * Guía fotográfica para reporte de daños post-terremoto.
 * Extraída de la "Guía Fotográfica para Reporte de Daños" del equipo técnico.
 * Cada grupo es un paso con instrucciones concretas de qué fotografiar para que
 * al inspector no le falte ninguna imagen importante.
 */

export const GRUPOS_FOTOS = [
  {
    key: 'fachada',
    obligatorio: true,
    emoji: '🏠',
    es: {
      titulo: 'Fachada y entrada',
      sub: 'Para que el inspector encuentre el edificio',
      instrucciones: [
        'Toma una foto completa de la fachada o entrada principal, desde la acera de enfrente.',
        'Que se vea el número, nombre del edificio o un punto de referencia cercano.',
        'Si puedes, incluye la calle para ubicar el acceso.',
      ],
    },
    en: {
      titulo: 'Façade and entrance',
      sub: 'So the inspector can find the building',
      instrucciones: [
        'Take a full photo of the façade or main entrance, from the opposite sidewalk.',
        'Make sure the number, building name or a nearby landmark is visible.',
        'If you can, include the street to locate the access point.',
      ],
    },
  },
  {
    key: 'estructural',
    obligatorio: false,
    emoji: '🧱',
    es: {
      titulo: 'Daños estructurales',
      sub: 'Columnas, vigas y paredes de carga',
      instrucciones: [
        'Fotografía columnas, vigas y paredes con grietas, partidas o aplastadas.',
        'Toma la grieta de cerca y también de lejos para ver el contexto.',
        'Busca grietas en diagonal o en forma de X: son las más peligrosas.',
        '⚠️ Hazlo SIEMPRE desde un lugar seguro. No entres si la estructura está inclinada o a punto de caer.',
      ],
    },
    en: {
      titulo: 'Structural damage',
      sub: 'Columns, beams and load-bearing walls',
      instrucciones: [
        'Photograph columns, beams and walls that are cracked, split or crushed.',
        'Take the crack close-up and also from afar to show context.',
        'Look for diagonal or X-shaped cracks: they are the most dangerous.',
        '⚠️ ALWAYS do it from a safe place. Do not enter if the structure is leaning or about to collapse.',
      ],
    },
  },
  {
    key: 'pisos_techos',
    obligatorio: false,
    emoji: '🪜',
    es: {
      titulo: 'Pisos, techos y escaleras',
      sub: 'Hundimientos y desprendimientos',
      instrucciones: [
        'Fotografía pisos hundidos o desnivelados y techos con hundimiento visible.',
        'Incluye escaleras rotas o separadas de la pared.',
        'Muestra paredes que se hayan separado de la estructura.',
      ],
    },
    en: {
      titulo: 'Floors, ceilings and stairs',
      sub: 'Sinking and detachment',
      instrucciones: [
        'Photograph sunken or uneven floors and ceilings with visible sagging.',
        'Include broken stairs or stairs detached from the wall.',
        'Show walls that have separated from the structure.',
      ],
    },
  },
  {
    key: 'riesgos',
    obligatorio: false,
    emoji: '⚠️',
    es: {
      titulo: 'Riesgos: gas, electricidad, fuego',
      sub: 'Solo desde lejos y seguro',
      instrucciones: [
        'Fotografía cables eléctricos caídos o tableros con chispas (desde lejos).',
        'Señales de fuga de gas o tuberías rotas, sin acercarte.',
        '🚨 Si hay olor a gas, fuego o chispas: NO te acerques. Aléjate y avisa a las autoridades.',
      ],
    },
    en: {
      titulo: 'Hazards: gas, electricity, fire',
      sub: 'Only from afar and safely',
      instrucciones: [
        'Photograph fallen power lines or sparking panels (from a distance).',
        'Signs of gas leaks or broken pipes, without getting close.',
        '🚨 If there is a gas smell, fire or sparks: do NOT approach. Move away and alert the authorities.',
      ],
    },
  },
];

export const SENALES_PELIGRO = {
  es: [
    'Paredes muy inclinadas o a punto de caer.',
    'Columnas o vigas rotas, partidas o aplastadas.',
    'Olor a gas o ruido de escape de tuberías.',
    'Cables eléctricos caídos o tableros con chispas.',
    'Pisos hundidos o paredes separadas de la estructura.',
    'Techo con hundimiento visible o desprendimiento masivo.',
  ],
  en: [
    'Severely leaning walls or about to fall.',
    'Broken, split or crushed columns or beams.',
    'Gas smell or sound of escaping pipes.',
    'Fallen power lines or sparking panels.',
    'Sunken floors or walls detached from the structure.',
    'Ceiling with visible sagging or massive detachment.',
  ],
};

export const MAX_FOTOS_TOTAL = 50;
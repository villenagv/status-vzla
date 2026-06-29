/**
 * Catálogo de áreas de inspección de edificios.
 * Cada foto subida durante una inspección presencial se clasifica en una de
 * estas áreas (y opcionalmente lleva una nota técnica). Se usa tanto en el
 * formulario del especialista como en la generación del informe PDF.
 */

export const AREAS_INSPECCION = [
  { val: 'cimentacion',     grupo: 'estructural', es: 'Cimentación',             en: 'Foundation' },
  { val: 'columnas',        grupo: 'estructural', es: 'Columnas',               en: 'Columns' },
  { val: 'vigas',           grupo: 'estructural', es: 'Vigas',                  en: 'Beams' },
  { val: 'muros_carga',     grupo: 'estructural', es: 'Muros de carga',         en: 'Load-bearing walls' },
  { val: 'losas_techos',    grupo: 'estructural', es: 'Losas / Techos',         en: 'Slabs / Roofs' },
  { val: 'fachada',         grupo: 'fachada',     es: 'Fachada / Revestimiento', en: 'Facade / Cladding' },
  { val: 'ventanas',        grupo: 'fachada',     es: 'Ventanas',               en: 'Windows' },
  { val: 'balcones',        grupo: 'fachada',     es: 'Balcones',               en: 'Balconies' },
  { val: 'cornisas',        grupo: 'fachada',     es: 'Cornisas / Aleros',      en: 'Cornices / Eaves' },
  { val: 'electricas',      grupo: 'instalaciones', es: 'Instalaciones eléctricas', en: 'Electrical systems' },
  { val: 'hidraulicas',     grupo: 'instalaciones', es: 'Hidráulicas / Sanitarias', en: 'Plumbing / Sanitary' },
  { val: 'gas',             grupo: 'instalaciones', es: 'Gas',                  en: 'Gas' },
  { val: 'iluminacion',     grupo: 'instalaciones', es: 'Iluminación',          en: 'Lighting' },
  { val: 'ascensores',      grupo: 'instalaciones', es: 'Ascensores',           en: 'Elevators' },
  { val: 'pisos',           grupo: 'acabados',    es: 'Pisos',                  en: 'Floors' },
  { val: 'techos_falsos',   grupo: 'acabados',    es: 'Techos falsos',          en: 'False ceilings' },
  { val: 'escaleras',       grupo: 'acabados',    es: 'Escaleras / Pasamanos',  en: 'Stairs / Railings' },
  { val: 'areas_comunes',   grupo: 'acabados',    es: 'Áreas comunes',          en: 'Common areas' },
  { val: 'general',         grupo: 'otros',       es: 'Vista general',          en: 'General view' },
  { val: 'otro',            grupo: 'otros',       es: 'Otro',                   en: 'Other' },
];

export const GRUPOS_AREA = [
  { val: 'estructural',   es: 'Estructural',   en: 'Structural' },
  { val: 'fachada',       es: 'Fachada',       en: 'Facade' },
  { val: 'instalaciones', es: 'Instalaciones', en: 'Systems' },
  { val: 'acabados',      es: 'Acabados',      en: 'Finishes' },
  { val: 'otros',         es: 'Otros',         en: 'Other' },
];

export function areaLabel(val, es = true) {
  const a = AREAS_INSPECCION.find(x => x.val === val);
  if (!a) return val || (es ? 'Sin área' : 'No area');
  return es ? a.es : a.en;
}
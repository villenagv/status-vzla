// Configuraciones compartidas del Directorio (personas + edificios)

export const PERSONA_ESTADO = {
  buscando:             { es: '🔴 Sin contacto',        en: '🔴 Missing',           cls: 'bg-red-100 text-red-800 border-red-200' },
  informacion_recibida: { es: '🔵 Con pistas',           en: '🔵 Has leads',         cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  visto_no_confirmado:  { es: '🟠 Visto sin confirmar',  en: '🟠 Seen unconfirmed',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  encontrado_con_vida:  { es: '✅ Localizado',           en: '✅ Located',           cls: 'bg-green-100 text-green-800 border-green-200' },
  en_hospital_refugio:  { es: '🏥 En refugio',           en: '🏥 In shelter',        cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  fallecido_reportado:  { es: '⚫ Fallecido (rep.)',      en: '⚫ Deceased (rep.)',   cls: 'bg-gray-200 text-gray-700 border-gray-300' },
  caso_cerrado:         { es: '🔒 Cerrado',              en: '🔒 Closed',           cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', cardBorder: '#D4AC0D', label: { es: '🟡 Daño leve',  en: '🟡 Minor damage'   }, icon: '🟡', acceso: { es: 'Entrada con precaución', en: 'Enter with caution' } },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', cardBorder: '#E67E22', label: { es: '🟠 Moderado',   en: '🟠 Moderate'       }, icon: '🟠', acceso: { es: 'Entrada limitada',       en: 'Limited entry'      } },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', cardBorder: '#E74C3C', label: { es: '🔴 GRAVE',      en: '🔴 SEVERE'         }, icon: '🔴', acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER'       } },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', cardBorder: '#922B21', label: { es: '🚨 CRÍTICO',    en: '🚨 CRITICAL'       }, icon: '🚨', acceso: { es: 'NO ENTRAR — PELIGRO',    en: 'DO NOT ENTER'       } },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', cardBorder: '#4A0E0E', label: { es: '💥 COLAPSADO',  en: '💥 COLLAPSED'      }, icon: '💥', acceso: { es: 'NO ENTRAR — COLAPSADO',  en: 'DO NOT ENTER'       } },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: '⚪ Sin evaluar',en: '⚪ Not evaluated'   }, icon: '⚪', acceso: { es: 'Sin verificar',          en: 'Unverified'         } },
  no_sabe:     { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: '⚪ Sin datos',  en: '⚪ No data'         }, icon: '⚪', acceso: { es: 'Sin información',        en: 'No information'     } },
};

export const CATEGORIAS_PERSONAS = [
  { id: 'desaparecidos', es: '🔴 Desaparecidos', en: '🔴 Missing', estados: ['buscando', 'informacion_recibida', 'visto_no_confirmado'] },
  { id: 'localizados',   es: '✅ Localizados',   en: '✅ Located',  estados: ['encontrado_con_vida', 'en_hospital_refugio'] },
  { id: 'encontrados',   es: '🙋 Encontrados',   en: '🙋 Found',   estados: ['encontrado_con_vida'], fuente: 'encontrada' },
  { id: 'institucional', es: '🏛️ Institucional', en: '🏛️ Institutional', fuente: 'institucional' },
  { id: 'estoy_aqui',    es: '📍 Estoy aquí',   en: '📍 I am here', fuente: 'cris' },
];

export const CATEGORIAS_EDIFICIOS = [
  { id: 'criticos',    es: '🆘 Críticos / Atrapados', en: '🆘 Critical / Trapped', niveles: ['critico', 'colapsado'], atrapados: true },
  { id: 'graves',      es: '🔴 Daño grave',           en: '🔴 Severe damage',       niveles: ['grave'] },
  { id: 'moderados',   es: '🟠 Daño moderado',        en: '🟠 Moderate damage',     niveles: ['moderado'] },
  { id: 'leves',       es: '🟡 Daño leve',            en: '🟡 Minor damage',        niveles: ['leve'] },
  { id: 'sin_evaluar', es: '⚪ Sin evaluar',           en: '⚪ Not evaluated',       niveles: ['no_evaluado', 'no_sabe'] },
];

export const FUENTE_BADGE = {
  busqueda:     { es: '🔴 Desaparecido',    en: '🔴 Missing',       cls: 'bg-red-50 text-red-700 border-red-200' },
  encontrada:   { es: '🙋 Encontrado',      en: '🙋 Found',         cls: 'bg-green-50 text-green-700 border-green-200' },
  cris:         { es: '📍 Estoy aquí',      en: '📍 I am here',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  institucional:{ es: '🏛️ Institucional',   en: '🏛️ Institutional', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export const PRIORIDAD_SORT = { critico: 0, colapsado: 1, grave: 2, moderado: 3, leve: 4, no_evaluado: 5, no_sabe: 6 };
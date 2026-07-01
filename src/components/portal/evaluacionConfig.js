// Configuración de colores/etiquetas para el estado de evaluación del
// Panel de Voluntarios y Profesionales (Período 6).
export const EVAL_CONFIG = {
  pendiente_asignacion: { color: '#6D28D9', bg: '#F5F3FF', border: '#C4B5FD', icon: '🟣', label: { es: 'Pendiente de asignación', en: 'Pending assignment' } },
  evaluacion_digital:   { color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD', icon: '🔵', label: { es: 'Evaluación digital',       en: 'Digital evaluation' } },
  evaluacion_presencial:{ color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', icon: '🟢', label: { es: 'Evaluación presencial',    en: 'On-site evaluation' } },
  no_concluyente:       { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', icon: '🟡', label: { es: 'Información incompleta',  en: 'Incomplete info' } },
  urgente:              { color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5', icon: '🔴', label: { es: 'Caso urgente',            en: 'Urgent case' } },
  cerrado:              { color: '#4B5563', bg: '#F9FAFB', border: '#D1D5DB', icon: '⚪', label: { es: 'Caso cerrado',            en: 'Case closed' } },
};

export const evalCfg = (val) => EVAL_CONFIG[val] || EVAL_CONFIG.pendiente_asignacion;

export const ESTATUS_OPTS = [
  { val: 'recibido',   es: 'Recibido',    en: 'Received' },
  { val: 'verificado', es: 'Verificado',  en: 'Verified' },
  { val: 'duplicado',  es: 'Duplicado',   en: 'Duplicate' },
  { val: 'falso',      es: 'Falso',       en: 'False' },
  { val: 'resuelto',   es: 'Resuelto',    en: 'Resolved' },
];

export const DANO_TIPO_OPTS = [
  { val: 'leve',        es: 'Leve',        en: 'Minor' },
  { val: 'moderado',    es: 'Moderado',    en: 'Moderate' },
  { val: 'grave',       es: 'Grave',       en: 'Severe' },
  { val: 'critico',     es: 'Crítico',     en: 'Critical' },
  { val: 'colapsado',   es: 'Colapsado',   en: 'Collapsed' },
  { val: 'no_evaluado', es: 'Sin evaluar', en: 'Not evaluated' },
];
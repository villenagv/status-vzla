// Configuración y utilidades compartidas de la ficha de edificio (EdificioDetalle)

export const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', semaforo: '🟡', label: { es: 'Daño leve',     en: 'Minor damage'   }, acceso: { es: 'Entrada con precaución', en: 'Enter with caution'     } },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', semaforo: '🟠', label: { es: 'Daño moderado', en: 'Moderate damage' }, acceso: { es: 'Entrada limitada',       en: 'Limited entry'          } },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', semaforo: '🔴', label: { es: 'Daño grave',    en: 'Severe damage'  }, acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER'           } },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', semaforo: '🔴', label: { es: 'CRÍTICO',       en: 'CRITICAL'       }, acceso: { es: 'NO ENTRAR — PELIGRO',    en: 'DO NOT ENTER — DANGER'  } },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', semaforo: '💥', label: { es: 'COLAPSADO',     en: 'COLLAPSED'      }, acceso: { es: 'NO ENTRAR — COLAPSADO',  en: 'DO NOT ENTER — COLLAPSED' } },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', semaforo: '⚪', label: { es: 'Sin evaluar',   en: 'Not evaluated'  }, acceso: { es: 'Sin verificar',          en: 'Unverified'             } },
};

export const ACCION_ESTILOS = {
  tengo_actualizacion:          { icon: '🔄', color: '#CA6F1E' },
  confirmo_mismo_estado:        { icon: '✅', color: '#2E7D32' },
  informacion_incorrecta:       { icon: '⚠️', color: '#D4621A' },
  reportar_urgencia:            { icon: '🚨', color: '#C0392B' },
  nuevo_nivel_dano:             { icon: '📍', color: '#2471A3' },
  personas_atrapadas:           { icon: '🆘', color: '#C0392B' },
  persona_herida_recuperada:    { icon: '🩹', color: '#B45309' },
  persona_fallecida_recuperada: { icon: '⚫', color: '#4B5563' },
  riesgo_marcado:               { icon: '💨', color: '#D4621A' },
  estado_cambiado:              { icon: '📋', color: '#555555' },
  verificado:                   { icon: '🏛️', color: '#00838F' },
};

export const ACCION_LABELS = {
  tengo_actualizacion:          { es: 'Nueva actualización',           en: 'New update'              },
  confirmo_mismo_estado:        { es: 'Estado confirmado',             en: 'Status confirmed'        },
  informacion_incorrecta:       { es: 'Reportado como incorrecto',     en: 'Reported as incorrect'   },
  reportar_urgencia:            { es: 'Urgencia reportada',            en: 'Urgency reported'        },
  nuevo_nivel_dano:             { es: 'Nivel de daño actualizado',     en: 'Damage level updated'    },
  personas_atrapadas:           { es: 'Personas atrapadas',            en: 'Trapped people'          },
  persona_herida_recuperada:    { es: 'Persona herida recuperada',     en: 'Injured person recovered'},
  persona_fallecida_recuperada: { es: 'Persona fallecida recuperada',  en: 'Deceased recovered'      },
  riesgo_marcado:               { es: 'Riesgo marcado',                en: 'Hazard marked'           },
  estado_cambiado:              { es: 'Estado cambiado',               en: 'Status changed'          },
  verificado:                   { es: 'Verificado por institución',    en: 'Verified by institution' },
};

export const TIPO_LABELS = {
  edificio_residencial: '🏠', hospital: '🏥', escuela: '🏫', iglesia: '⛪',
  comercio: '🏪', calle_via: '🛣️', puente: '🌉', servicio_publico: '🔌', otro: '📋',
};

export function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d} día${d > 1 ? 's' : ''}` : `${d} day${d > 1 ? 's' : ''} ago`;
  if (h > 0) return es ? `hace ${h} hora${h > 1 ? 's' : ''}` : `${h} hour${h > 1 ? 's' : ''} ago`;
  if (m < 1) return es ? 'ahora mismo' : 'just now';
  return es ? `hace ${m} min` : `${m} min ago`;
}
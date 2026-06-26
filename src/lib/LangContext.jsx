import { createContext, useContext, useState } from 'react';

const T = {
  es: {
    brand: 'STATUSVZLA',
    tagline: 'Sistema de respuesta a emergencias · Venezuela',
    lang_toggle: 'English',
    low_bw: 'Modo bajo consumo',
    low_bw_active: 'Bajo consumo activo',
    counters_loading: 'Cargando datos...',
    counters_next: 'Actualiza en',
    criticos: 'críticos',
    atrapados: 'atrapados',
    reportes: 'reportes',
    puntos_abiertos: 'puntos de ayuda abiertos',
    saturados: 'saturados',
    // Entrada principal
    card1_title: 'Estoy en una zona afectada',
    card1_desc: 'Reporta daños, personas atrapadas, riesgos o pide ayuda urgente',
    card2_title: 'Busco información sobre una zona',
    card2_desc: 'Consulta el estado de edificios, refugios activos y zonas reportadas',
    card3_title: 'Soy una institución o punto de ayuda',
    card3_desc: 'Registra tu refugio, hospital, comedor o centro de donaciones',
    card_buscar_title: 'Estoy buscando a alguien',
    card_buscar_desc: 'Registra a una persona desaparecida con su última ubicación y tus datos de contacto',
    card_encontrado_title: 'Encontré o vi a alguien',
    card_encontrado_desc: 'Reporta a alguien como a salvo, herido, en refugio u hospital, o fallecido',
    no_reg: 'Sin registro · Acceso inmediato · Sin internet requerido para leer',
    // Reportar
    report_title: 'Reportar emergencia',
    report_desc: 'Usa este formulario para reportar daños visibles, personas atrapadas o riesgos como gas, electricidad o colapso.',
    report_warning: 'No entres a estructuras dañadas. Espera a Protección Civil, Bomberos o rescatistas.',
    field_tipo: 'Tipo de reporte',
    field_dir: 'Dirección o referencia',
    field_ciudad: 'Ciudad',
    field_estado: 'Estado / Región',
    field_nivel_dano: 'Nivel de daño',
    field_personas: '¿Hay personas atrapadas?',
    field_riesgos: 'Riesgos presentes',
    field_desc: 'Descripción adicional (opcional)',
    field_nombre: 'Tu nombre (opcional)',
    field_tel: 'Teléfono de contacto (no se publica)',
    btn_enviar: 'Enviar reporte',
    btn_volver: 'Volver',
    enviado_ok: '✅ Reporte enviado. Gracias por ayudar.',
    enviado_err: 'Error al enviar. Verifica tu conexión.',
    modo_rapido: 'Modo rápido',
    modo_completo: 'Modo completo',
    // Consultar
    consult_title: 'Consultar zonas y reportes',
    consult_desc: 'Busca por ciudad o zona para ver el estado actual de edificios, refugios y reportes.',
    buscar_placeholder: 'Ciudad, municipio o zona...',
    btn_buscar: 'Buscar',
    ver_mas: 'Ver más resultados',
    sin_resultados: 'No se encontraron reportes para esta búsqueda.',
    // Institucional
    inst_title: 'Registrar punto de ayuda',
    inst_desc: 'Usa este formulario para registrar un refugio, hospital, comedor, centro de acopio o punto de donaciones. Los datos privados no se publicarán.',
    field_nombre_lugar: 'Nombre del lugar',
    field_tipo_lugar: 'Tipo de lugar',
    field_estado_op: 'Estado operativo',
    field_capacidad: 'Capacidad máxima',
    field_servicios: 'Servicios disponibles',
    field_necesidades: 'Necesidades urgentes',
    field_contacto: 'Contacto público (WhatsApp, teléfono)',
    btn_guardar: 'Guardar punto de ayuda',
    // Seguridad
    anti_extorsion: '⚠️ Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.',
  },
  en: {
    brand: 'STATUSVZLA',
    tagline: 'Emergency response system · Venezuela',
    lang_toggle: 'Español',
    low_bw: 'Low-bandwidth mode',
    low_bw_active: 'Low-bandwidth ON',
    counters_loading: 'Loading data...',
    counters_next: 'Updates in',
    criticos: 'critical',
    atrapados: 'trapped',
    reportes: 'reports',
    puntos_abiertos: 'open help points',
    saturados: 'saturated',
    card1_title: 'I am in an affected area',
    card1_desc: 'Report damage, trapped people, hazards or request urgent help',
    card2_title: 'I am looking for information about an area',
    card2_desc: 'Check the status of buildings, active shelters and reported zones',
    card3_title: 'I represent an institution or help point',
    card3_desc: 'Register your shelter, hospital, food center or donation point',
    card_buscar_title: 'I am looking for someone',
    card_buscar_desc: 'Register a missing person with their last known location and your contact details',
    card_encontrado_title: 'I found or saw someone',
    card_encontrado_desc: 'Report someone as safe, injured, in a shelter/hospital, or deceased',
    no_reg: 'No registration · Immediate access · No internet required to read',
    report_title: 'Report emergency',
    report_desc: 'Use this form to report visible damage, trapped people, or hazards like gas, electricity or collapse.',
    report_warning: 'Do not enter damaged structures. Wait for Civil Protection, firefighters or rescue teams.',
    field_tipo: 'Report type',
    field_dir: 'Address or reference',
    field_ciudad: 'City',
    field_estado: 'State / Region',
    field_nivel_dano: 'Damage level',
    field_personas: 'Are there trapped people?',
    field_riesgos: 'Present hazards',
    field_desc: 'Additional description (optional)',
    field_nombre: 'Your name (optional)',
    field_tel: 'Contact phone (not published)',
    btn_enviar: 'Submit report',
    btn_volver: 'Go back',
    enviado_ok: '✅ Report submitted. Thank you for helping.',
    enviado_err: 'Error submitting. Check your connection.',
    modo_rapido: 'Quick mode',
    modo_completo: 'Full mode',
    consult_title: 'Search zones and reports',
    consult_desc: 'Search by city or zone to see the current status of buildings, shelters and reports.',
    buscar_placeholder: 'City, municipality or zone...',
    btn_buscar: 'Search',
    ver_mas: 'Load more results',
    sin_resultados: 'No reports found for this search.',
    inst_title: 'Register help point',
    inst_desc: 'Use this form to register a shelter, hospital, food center, supply depot or donation point. Private data will not be published.',
    field_nombre_lugar: 'Place name',
    field_tipo_lugar: 'Place type',
    field_estado_op: 'Operational status',
    field_capacidad: 'Maximum capacity',
    field_servicios: 'Available services',
    field_necesidades: 'Urgent needs',
    field_contacto: 'Public contact (WhatsApp, phone)',
    btn_guardar: 'Save help point',
    anti_extorsion: '⚠️ Never send money in exchange for information. This platform does not authorize payments or private rescue fees.',
  }
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('svzla_lang');
    if (!stored) localStorage.setItem('svzla_lang', 'es');
    return stored || 'es';
  });
  const toggle = () => {
    const next = lang === 'es' ? 'en' : 'es';
    setLang(next);
    localStorage.setItem('svzla_lang', next);
  };
  return (
    <LangContext.Provider value={{ lang, toggle, t: T[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
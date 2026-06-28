import { useEffect, useRef } from 'react';

/**
 * JsonLd — Inyecta datos estructurados (Schema.org) en el <head>
 * para que buscadores e IAs (ChatGPT, Gemini, Perplexity) lean
 * los datos de edificios y personas sin ejecutar JavaScript.
 * No renderiza nada visible.
 */
export default function JsonLd({ data }) {
  const scriptRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    // Eliminar script anterior si existe
    if (scriptRef.current && document.head.contains(scriptRef.current)) {
      document.head.removeChild(scriptRef.current);
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data, null, 0);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
    };
  }, [JSON.stringify(data)]);

  return null;
}

// ── Helpers para generar esquemas específicos ──────────────────────────────

export function buildEdificioJsonLd(edificio, lang = 'es') {
  if (!edificio) return null;
  const es = lang === 'es';
  const DANO_LABEL = {
    leve:        es ? 'Daño leve'       : 'Minor damage',
    moderado:    es ? 'Daño moderado'   : 'Moderate damage',
    grave:       es ? 'Daño grave'      : 'Severe damage',
    critico:     es ? 'Daño crítico'    : 'Critical damage',
    colapsado:   es ? 'Colapsado'       : 'Collapsed',
    no_evaluado: es ? 'Sin evaluar'     : 'Not evaluated',
  };
  const ACCESO_LABEL = {
    no_entrar:        es ? 'NO ENTRAR'              : 'DO NOT ENTER',
    solo_rescatistas: es ? 'Solo rescatistas'       : 'Rescue teams only',
    entrada_limitada: es ? 'Entrada limitada'       : 'Limited entry',
    entrada_autorizada: es ? 'Entrada autorizada'   : 'Entry authorized',
    clausurado:       es ? 'Clausurado'             : 'Closed by authority',
    no_verificado:    es ? 'Sin verificar'          : 'Unverified',
  };

  const noEntrar = ['grave', 'critico', 'colapsado'].includes(edificio.nivel_dano);
  const nombre = edificio.nombre_lugar || (es ? 'Edificio sin nombre' : 'Unnamed building');
  const direccion = [edificio.direccion, edificio.ciudad, edificio.estado_region].filter(Boolean).join(', ');
  const estadoDano = DANO_LABEL[edificio.nivel_dano] || DANO_LABEL.no_evaluado;
  const estadoAcceso = ACCESO_LABEL[edificio.estado_acceso] || (noEntrar ? (es ? 'NO ENTRAR' : 'DO NOT ENTER') : (es ? 'Sin verificar' : 'Unverified'));

  const riesgos = [
    edificio.riesgo_gas       && (es ? 'Riesgo de gas'            : 'Gas hazard'),
    edificio.riesgo_electrico && (es ? 'Riesgo eléctrico'         : 'Electrical hazard'),
    edificio.riesgo_incendio  && (es ? 'Riesgo de incendio'       : 'Fire hazard'),
    edificio.riesgo_colapso   && (es ? 'Riesgo de colapso'        : 'Collapse hazard'),
  ].filter(Boolean);

  const descripcionCompleta = [
    estadoDano,
    noEntrar ? (es ? '⚠️ NO ENTRAR.' : '⚠️ DO NOT ENTER.') : null,
    edificio.personas_atrapadas === 'si' ? (es ? '🆘 Personas atrapadas reportadas.' : '🆘 Trapped people reported.') : null,
    riesgos.length > 0 ? (es ? `Riesgos: ${riesgos.join(', ')}.` : `Hazards: ${riesgos.join(', ')}.`) : null,
    edificio.descripcion || null,
  ].filter(Boolean).join(' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    'name': nombre,
    'description': descripcionCompleta,
    'url': `https://statusvzla.com/edificio?id=${edificio.id}`,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': edificio.direccion || '',
      'addressLocality': edificio.ciudad || '',
      'addressRegion': edificio.estado_region || '',
      'addressCountry': 'VE',
    },
    'additionalProperty': [
      { '@type': 'PropertyValue', 'name': es ? 'Nivel de daño' : 'Damage level', 'value': estadoDano },
      { '@type': 'PropertyValue', 'name': es ? 'Estado de acceso' : 'Access status', 'value': estadoAcceso },
      { '@type': 'PropertyValue', 'name': es ? 'Personas atrapadas' : 'Trapped people', 'value': edificio.personas_atrapadas || 'no_sabe' },
      { '@type': 'PropertyValue', 'name': es ? 'Nivel de verificación' : 'Verification level', 'value': edificio.nivel_verificacion || 'sin_verificar' },
      { '@type': 'PropertyValue', 'name': es ? 'Fuente' : 'Source', 'value': 'Status Vzla — Ciudadanos Venezuela' },
    ],
    'dateModified': edificio.updated_date || edificio.created_date,
    'datePublished': edificio.created_date,
  };

  // Agregar coordenadas si existen
  if (edificio.lat && edificio.lng) {
    jsonLd['geo'] = {
      '@type': 'GeoCoordinates',
      'latitude': edificio.lat,
      'longitude': edificio.lng,
    };
  }

  // Agregar foto si existe
  if (edificio.foto_urls && edificio.foto_urls.length > 0) {
    jsonLd['image'] = edificio.foto_urls[0];
  }

  return jsonLd;
}

export function buildPersonaJsonLd(persona, lang = 'es') {
  if (!persona) return null;
  const es = lang === 'es';
  const ESTADO_LABEL = {
    buscando:             es ? 'Buscando — sin contacto'     : 'Searching — no contact',
    informacion_recibida: es ? 'Con pistas recibidas'        : 'Has leads received',
    visto_no_confirmado:  es ? 'Visto sin confirmar'         : 'Seen, unconfirmed',
    encontrado_con_vida:  es ? 'Localizado con vida'         : 'Located alive',
    en_hospital_refugio:  es ? 'En hospital o refugio'       : 'In hospital or shelter',
    fallecido_reportado:  es ? 'Fallecido (reportado)'       : 'Deceased (reported)',
    caso_cerrado:         es ? 'Caso cerrado'                : 'Case closed',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': persona.nombre_completo,
    'alternateName': persona.apodo || undefined,
    'description': [
      ESTADO_LABEL[persona.estado_caso] || ESTADO_LABEL.buscando,
      persona.descripcion_fisica ? (es ? `Descripción: ${persona.descripcion_fisica}` : `Description: ${persona.descripcion_fisica}`) : null,
      persona.ultima_ubicacion_conocida ? (es ? `Última ubicación: ${persona.ultima_ubicacion_conocida}, ${persona.ciudad || ''}` : `Last location: ${persona.ultima_ubicacion_conocida}, ${persona.ciudad || ''}`) : null,
      persona.notas_publicas || null,
    ].filter(Boolean).join('. '),
    'url': `https://statusvzla.com/persona?id=${persona.id}`,
    'image': persona.foto_url || undefined,
    'additionalProperty': [
      { '@type': 'PropertyValue', 'name': es ? 'Estado del caso' : 'Case status', 'value': ESTADO_LABEL[persona.estado_caso] || 'Buscando' },
      { '@type': 'PropertyValue', 'name': es ? 'Ciudad' : 'City', 'value': persona.ciudad || '' },
      { '@type': 'PropertyValue', 'name': es ? 'Fuente' : 'Source', 'value': 'Status Vzla — Ciudadanos Venezuela' },
    ],
    'datePublished': persona.created_date,
    'dateModified': persona.updated_date || persona.created_date,
  };
}

export function buildSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Status Vzla',
    'alternateName': 'CRIS Venezuela',
    'description': 'Sistema ciudadano de respuesta a emergencias en Venezuela. Reporta daños en edificios, busca personas desaparecidas, encuentra refugios y puntos de ayuda.',
    'url': 'https://statusvzla.com',
    'inLanguage': ['es', 'en'],
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://statusvzla.com/consultar?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Status Vzla',
      'url': 'https://statusvzla.com',
    },
  };
}
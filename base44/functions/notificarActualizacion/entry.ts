import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ESTADO_LABEL = {
  es: {
    buscando: 'Buscando información',
    informacion_recibida: 'Información recibida',
    visto_no_confirmado: 'Visto — sin confirmar',
    encontrado_con_vida: 'Encontrado/a con vida',
    en_hospital_refugio: 'En hospital o refugio',
    fallecido_reportado: 'Fallecimiento reportado',
    caso_cerrado: 'Caso cerrado',
  },
  en: {
    buscando: 'Searching for information',
    informacion_recibida: 'Information received',
    visto_no_confirmado: 'Seen — unconfirmed',
    encontrado_con_vida: 'Found alive',
    en_hospital_refugio: 'In hospital or shelter',
    fallecido_reportado: 'Death reported',
    caso_cerrado: 'Case closed',
  },
};

const ESTADO_COLOR = {
  buscando: '#D48C2E',
  informacion_recibida: '#3B72C4',
  visto_no_confirmado: '#E87A30',
  encontrado_con_vida: '#2E7D32',
  en_hospital_refugio: '#0097A7',
  fallecido_reportado: '#616161',
  caso_cerrado: '#9E9E9E',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { persona_id, tipo_evento, datos_persona, lang = 'es' } = await req.json();

    if (!persona_id) return Response.json({ error: 'persona_id requerido' }, { status: 400 });

    const nombre = datos_persona?.nombre_completo || 'La persona';
    const estadoCaso = datos_persona?.estado_caso || 'buscando';
    const ubicacion = datos_persona?.ubicacion || '';
    const estadoLabel = ESTADO_LABEL[lang]?.[estadoCaso] || estadoCaso;
    const color = ESTADO_COLOR[estadoCaso] || '#1A1F2E';

    // Envío centralizado — notificarTodo consulta suscripciones + grupos propios
    const result = await base44.asServiceRole.functions.invoke('notificarTodo', {
      tipo: 'persona',
      entidad_id: persona_id,
      nombre,
      estado_label: estadoLabel,
      estado_color: color,
      ubicacion,
      mensaje: datos_persona?.mensaje || '',
      lang,
    });

    return Response.json({ ok: true, notificados: result.enviados || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
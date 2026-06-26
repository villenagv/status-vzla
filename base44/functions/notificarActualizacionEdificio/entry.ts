import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const NIVEL_LABELS = {
  es: {
    leve:       'Daño leve',
    moderado:   'Daño moderado',
    grave:      'Daño grave — NO ENTRAR',
    critico:    'CRÍTICO — NO ENTRAR',
    colapsado:  'COLABSADO — EVACUADO',
    no_evaluado:'Sin evaluar',
  },
  en: {
    leve:       'Minor damage',
    moderado:   'Moderate damage',
    grave:      'Severe damage — DO NOT ENTER',
    critico:    'CRITICAL — DO NOT ENTER',
    colapsado:  'COLLAPSED — EVACUATED',
    no_evaluado:'Not evaluated',
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { edificio_id, nivel_dano, direccion, nombre_lugar, reportante_nombre, lang = 'es' } = await req.json();

    if (!edificio_id) return Response.json({ error: 'edificio_id requerido' }, { status: 400 });

    const nivelDesc = NIVEL_LABELS[lang]?.[nivel_dano] || nivel_dano;

    // Envío centralizado — notificarTodo consulta suscriptores + grupos
    const result = await base44.asServiceRole.functions.invoke('notificarTodo', {
      tipo: 'edificio',
      entidad_id: edificio_id,
      nombre: nombre_lugar || 'Edificio',
      estado_label: nivelDesc,
      estado_color: '#C0392B',
      ubicacion: direccion,
      mensaje: reportante_nombre ? `Reportado por ${reportante_nombre}` : '',
      lang,
    });

    return Response.json({ ok: true, notificados: result.enviados || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
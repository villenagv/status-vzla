import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { edificio_id, nivel_dano, direccion, nombre_lugar, reportante_nombre, lang } = await req.json();

    if (!edificio_id) return Response.json({ error: 'edificio_id requerido' }, { status: 400 });

    const nivelLabels = {
      leve:       'Daño leve',
      moderado:   'Daño moderado',
      grave:      'Daño grave — NO ENTRAR',
      critico:    'CRÍTICO — NO ENTRAR',
      colapsado:  'COLABSADO — EVACUADO',
      no_evaluado:'Sin evaluar',
    };

    const nivelDesc = nivelLabels[nivel_dano] || nivel_dano;

    // Envío centralizado — notificarTodo consulta suscriptores + grupos
    const result = await base44.asServiceRole.functions.invoke('notificarTodo', {
      tipo: 'edificio',
      entidad_id: edificio_id,
      nombre: nombre_lugar || 'Edificio',
      estado_label: nivelDesc,
      estado_color: '#C0392B',
      ubicacion: direccion,
      mensaje: reportante_nombre ? `Reportado por ${reportante_nombre}` : '',
      lang: lang || 'es',
    });

    return Response.json({ ok: true, notificados: result.enviados || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
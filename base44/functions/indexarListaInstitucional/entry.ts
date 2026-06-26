import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { file_url, institucion_id, institucion_nombre } = await req.json();

    if (!file_url || !institucion_id) {
      return Response.json({ error: 'file_url e institucion_id son requeridos' }, { status: 400 });
    }

    const schema = {
      type: 'object',
      properties: {
        personas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nombre_completo: { type: 'string' },
              fecha_nacimiento: { type: 'string', description: 'Fecha de nacimiento en formato DD/MM/AAAA o texto libre' },
              edad_aprox: { type: 'string' },
              sexo: { type: 'string' },
              telefono_contacto: { type: 'string' },
              documento_identidad: { type: 'string' },
              condicion: { type: 'string', description: 'a_salvo, herido_leve, herido_grave, fallecido_reportado, no_identificado, no_sabe' },
              observaciones: { type: 'string' }
            }
          }
        },
        total_detectado: { type: 'number' },
        advertencias: { type: 'string' }
      }
    };

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: schema
    });

    if (result.status !== 'success' || !result.output?.personas) {
      return Response.json({
        status: 'error',
        mensaje: 'No se pudo extraer información del archivo. Intenta con una imagen más clara o usa el modo manual.',
        raw: result
      }, { status: 422 });
    }

    const personas = result.output.personas.map(p => ({
      ...p,
      institucion_id,
      institucion_nombre: institucion_nombre || '',
      nivel_verificacion: 'borrador',
      fuente: 'institucional',
      condicion: ['a_salvo','herido_leve','herido_grave','fallecido_reportado','no_identificado','no_sabe'].includes(p.condicion)
        ? p.condicion : 'no_sabe'
    }));

    return Response.json({
      status: 'success',
      personas,
      total: personas.length,
      advertencias: result.output.advertencias || null
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
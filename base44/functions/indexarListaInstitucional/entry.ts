import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Map de columnas posibles (español e inglés, variaciones comunes)
const CONDICION_MAP = {
  'a salvo': 'a_salvo', 'a_salvo': 'a_salvo', 'safe': 'a_salvo', 'bien': 'a_salvo',
  'herido leve': 'herido_leve', 'herido_leve': 'herido_leve', 'minor injury': 'herido_leve', 'leve': 'herido_leve',
  'herido grave': 'herido_grave', 'herido_grave': 'herido_grave', 'serious injury': 'herido_grave', 'grave': 'herido_grave',
  'fallecido reportado': 'fallecido_reportado', 'fallecido_reportado': 'fallecido_reportado', 'death reported': 'fallecido_reportado', 'fallecido': 'fallecido_reportado',
  'no identificado': 'no_identificado', 'no_identificado': 'no_identificado', 'unidentified': 'no_identificado',
  'no sabe': 'no_sabe', 'no_sabe': 'no_sabe', 'unknown': 'no_sabe', 'n/a': 'no_sabe', 'desconocido': 'no_sabe',
};

function normalizeCondicion(val) {
  if (!val) return 'no_sabe';
  return CONDICION_MAP[String(val).toLowerCase().trim()] || 'no_sabe';
}

// Encuentra el valor de una fila buscando múltiples nombres de columna posibles
function getField(row, ...keys) {
  for (const key of keys) {
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase().trim() === key.toLowerCase()) {
        const val = row[rowKey];
        if (val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim().toLowerCase() !== 'n/a') {
          return String(val).trim();
        }
        return '';
      }
    }
  }
  return '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { file_url, institucion_id, institucion_nombre } = await req.json();

    if (!file_url || !institucion_id) {
      return Response.json({ error: 'file_url e institucion_id son requeridos' }, { status: 400 });
    }

    // Schema de fila individual (no envuelto en objeto con "personas")
    const rowSchema = {
      type: 'object',
      properties: {
        nombre_completo: { type: 'string' },
        fecha_nacimiento: { type: 'string' },
        telefono_contacto: { type: 'string' },
        email: { type: 'string' },
        condicion: { type: 'string' },
        observaciones: { type: 'string' },
      }
    };

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: rowSchema,
    });

    if (result.status !== 'success' || !result.output) {
      return Response.json({
        status: 'error',
        mensaje: 'No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) o CSV válido.',
        raw: result
      }, { status: 422 });
    }

    // output puede ser array de filas o un objeto con las filas directamente
    let rows = Array.isArray(result.output) ? result.output : [result.output];

    // Filtrar filas vacías
    rows = rows.filter(r => r && (r.nombre_completo || getField(r, 'nombre completo', 'nombre', 'full name', 'name')));

    if (rows.length === 0) {
      return Response.json({
        status: 'error',
        mensaje: 'El archivo no contiene filas con nombres válidos. Revisa el formato.',
      }, { status: 422 });
    }

    const personas = rows.map(r => ({
      nombre_completo: r.nombre_completo || getField(r, 'nombre completo', 'nombre', 'full name', 'name'),
      fecha_nacimiento: r.fecha_nacimiento || getField(r, 'fecha de nacimiento', 'fecha nacimiento', 'date of birth', 'nacimiento'),
      telefono_contacto: r.telefono_contacto || getField(r, 'teléfono de contacto', 'telefono de contacto', 'teléfono', 'telefono', 'phone', 'contact phone'),
      email: r.email || getField(r, 'email', 'correo', 'correo electrónico', 'e-mail'),
      condicion: normalizeCondicion(r.condicion || getField(r, 'condición', 'condicion', 'condition', 'estado')),
      observaciones: r.observaciones || getField(r, 'observaciones', 'notas', 'notes', 'obs'),
      institucion_id,
      institucion_nombre: institucion_nombre || '',
      nivel_verificacion: 'borrador',
      fuente: 'institucional',
    }));

    return Response.json({
      status: 'success',
      personas,
      total: personas.length,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
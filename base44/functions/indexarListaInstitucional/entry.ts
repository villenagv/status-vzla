import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

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

function getField(row, ...keys) {
  for (const key of keys) {
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase().trim() === key.toLowerCase()) {
        const val = row[rowKey];
        if (val !== null && val !== undefined) {
          const s = String(val).trim();
          if (s && s.toLowerCase() !== 'n/a') return s;
        }
      }
    }
  }
  return '';
}

function parseXlsxBuffer(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, institucion_id, institucion_nombre, centro_apoyo, solo_parsear } = await req.json();

    if (!file_url || !institucion_id) {
      return Response.json({ error: 'file_url e institucion_id son requeridos' }, { status: 400 });
    }

    // Descargar el archivo
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) return Response.json({ error: 'No se pudo descargar el archivo' }, { status: 422 });

    const contentType = fileResp.headers.get('content-type') || '';
    const buffer = await fileResp.arrayBuffer();

    let rows = [];

    // CSV o Excel
    try {
      const buf = new Uint8Array(buffer);
      rows = parseXlsxBuffer(buf);
    } catch {
      // Si falla xlsx, intentar como CSV texto plano
      const text = new TextDecoder().decode(buffer);
      const lines = text.split('\n').filter(l => l.trim().length > 1);
      if (lines.length < 2) {
        return Response.json({ error: 'Archivo no reconocido o vacío' }, { status: 422 });
      }
      const headers = lines[0].split(/,|;|\t/).map(h => h.trim().replace(/"/g, ''));
      rows = lines.slice(1).map(line => {
        const vals = line.split(/,|;|\t/).map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });
    }

    // Filtrar filas vacías
    rows = rows.filter(r => {
      const nombre = getField(r, 'nombre completo', 'nombre', 'full name', 'name', 'nombre_completo');
      return nombre.length > 1;
    });

    if (rows.length === 0) {
      return Response.json({ error: 'No se encontraron filas con nombres válidos en el archivo.' }, { status: 422 });
    }

    const personas = rows.map(r => ({
      nombre_completo: getField(r, 'nombre completo', 'nombre', 'full name', 'name', 'nombre_completo'),
      fecha_nacimiento: getField(r, 'fecha de nacimiento', 'fecha nacimiento', 'nacimiento', 'date of birth', 'fecha_nacimiento'),
      telefono_contacto: getField(r, 'teléfono de contacto', 'telefono de contacto', 'teléfono', 'telefono', 'phone', 'telefono_contacto'),
      email: getField(r, 'email', 'correo', 'correo electrónico', 'e-mail'),
      condicion: normalizeCondicion(getField(r, 'condición', 'condicion', 'condition', 'estado')),
      observaciones: getField(r, 'observaciones', 'notas', 'notes', 'obs'),
      institucion_id,
      institucion_nombre: institucion_nombre || '',
      centro_apoyo: centro_apoyo || '',
      nivel_verificacion: 'institucional',
      fuente: 'institucional',
    }));

    // Si solo_parsear=true, devolver sin guardar (para preview o flujos de duplicados en cliente)
    if (solo_parsear) {
      return Response.json({ status: 'success', personas, total: personas.length });
    }

    // GUARDAR cada persona en la base de datos
    const creadas = [];
    const errores = [];
    for (const p of personas) {
      try {
        const creada = await base44.asServiceRole.entities.PersonaRegistrada.create(p);
        creadas.push(creada);
      } catch (e) {
        errores.push({ nombre: p.nombre_completo, error: e.message });
      }
    }

    return Response.json({
      status: 'success',
      total: personas.length,
      guardadas: creadas.length,
      errores: errores.length,
      detalles_errores: errores,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
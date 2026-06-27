import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

const ADMIN_EMAIL = 'villenagv@gmail.com';

// Mapas de normalización
const TIPO_MAP = {
  'hotel': 'otro', 'hostal': 'otro', 'posada': 'otro',
  'edificio': 'edificio_residencial', 'residencial': 'edificio_residencial', 'edificio residencial': 'edificio_residencial', 'apartamento': 'edificio_residencial',
  'hospital': 'hospital', 'clinica': 'hospital', 'clínica': 'hospital', 'ambulatorio': 'hospital', 'upa': 'hospital',
  'escuela': 'escuela', 'colegio': 'escuela', 'liceo': 'escuela', 'universidad': 'escuela',
  'iglesia': 'iglesia', 'capilla': 'iglesia', 'templo': 'iglesia',
  'comercio': 'comercio', 'local': 'comercio', 'tienda': 'comercio', 'supermercado': 'comercio',
  'calle': 'calle_via', 'via': 'calle_via', 'vía': 'calle_via', 'avenida': 'calle_via',
  'puente': 'puente', 'viaducto': 'puente',
  'refugio': 'refugio', 'albergue': 'refugio',
  'servicio publico': 'servicio_publico', 'servicio_publico': 'servicio_publico',
};

const DANO_MAP = {
  'sin daños': 'leve', 'sin danos': 'leve', 'none': 'leve',
  'leve': 'leve', 'minor': 'leve', 'menor': 'leve',
  'moderado': 'moderado', 'moderate': 'moderado', 'medio': 'moderado',
  'grave': 'grave', 'serious': 'grave', 'severo': 'grave',
  'critico': 'critico', 'crítico': 'critico', 'critical': 'critico',
  'colapsado': 'colapsado', 'colapso total': 'colapsado', 'collapsed': 'colapsado', 'derrumbado': 'colapsado', 'destruido': 'colapsado',
  'colapso parcial': 'grave', 'partial collapse': 'grave',
  'no sabe': 'no_evaluado', 'n/a': 'no_evaluado', 'desconocido': 'no_evaluado', 'no_evaluado': 'no_evaluado', 'sin evaluar': 'no_evaluado',
};

const VERIFICACION_MAP = {
  'confirmado': 'institucional', 'confirmed': 'institucional', 'verificado': 'institucional', 'verified': 'institucional',
  'comunidad': 'comunidad', 'community': 'comunidad', 'reportado': 'comunidad', 'sin verificar': 'sin_verificar',
  'sin_verificar': 'sin_verificar', 'unverified': 'sin_verificar',
};

function normTipo(val) {
  if (!val) return 'otro';
  const v = String(val).toLowerCase().trim();
  return TIPO_MAP[v] || 'otro';
}

function normDano(val) {
  if (!val) return 'no_evaluado';
  const v = String(val).toLowerCase().trim();
  return DANO_MAP[v] || 'no_evaluado';
}

function normVerif(val) {
  if (!val) return 'sin_verificar';
  const v = String(val).toLowerCase().trim();
  return VERIFICACION_MAP[v] || 'sin_verificar';
}

function normBool(val) {
  if (!val) return false;
  const v = String(val).toLowerCase().trim();
  return v === 'true' || v === 'si' || v === 'sí' || v === 'yes' || v === '1';
}

function getField(row, ...keys) {
  for (const key of keys) {
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase().trim().replace(/[áéíóú]/g, c => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'}[c]||c)) ===
          key.toLowerCase().trim()) {
        const val = row[rowKey];
        if (val !== null && val !== undefined) {
          const s = String(val).trim();
          if (s && s.toLowerCase() !== 'n/a' && s !== '') return s;
        }
      }
    }
  }
  return '';
}

function parseFotoUrls(val) {
  if (!val) return [];
  // Soporta múltiples URLs separadas por coma o punto y coma
  return String(val).split(/[,;]+/).map(u => u.trim()).filter(u => u.startsWith('http'));
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

    // Solo el admin autorizado puede usar este endpoint
    if (user.email !== ADMIN_EMAIL) {
      return Response.json({ error: 'Acceso denegado. Solo el administrador puede usar esta función.' }, { status: 403 });
    }

    const { file_url, solo_parsear } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url es requerido' }, { status: 400 });
    }

    // Descargar el archivo
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) return Response.json({ error: 'No se pudo descargar el archivo' }, { status: 422 });

    const buffer = await fileResp.arrayBuffer();
    let rows = [];

    try {
      rows = parseXlsxBuffer(new Uint8Array(buffer));
    } catch {
      // Fallback a CSV texto plano
      const text = new TextDecoder().decode(buffer);
      const lines = text.split('\n').filter(l => l.trim().length > 1);
      if (lines.length < 2) return Response.json({ error: 'Archivo vacío o no reconocido' }, { status: 422 });
      const headers = lines[0].split(/,|;|\t/).map(h => h.trim().replace(/"/g, ''));
      rows = lines.slice(1).map(line => {
        const vals = [];
        let cur = '', quoted = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') { quoted = !quoted; }
          else if ((ch === ',' || ch === ';') && !quoted) { vals.push(cur.trim()); cur = ''; }
          else cur += ch;
        }
        vals.push(cur.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, ''); });
        return obj;
      });
    }

    // Filtrar filas sin nombre
    rows = rows.filter(r => getField(r, 'Nombre', 'nombre_lugar', 'nombre lugar', 'name', 'lugar').length > 1);

    if (rows.length === 0) {
      return Response.json({ error: 'No se encontraron filas con nombres válidos.' }, { status: 422 });
    }

    const edificios = rows.map(r => {
      const nivelDano = normDano(getField(r, 'NivelDano', 'nivel_dano', 'nivel dano', 'nivel daño', 'damage', 'daño', 'dano', 'estado'));
      const tipo = normTipo(getField(r, 'Tipo', 'tipo_estructura', 'tipo estructura', 'type', 'categoria'));
      const verif = normVerif(getField(r, 'Verificacion', 'verificacion', 'verificación', 'estado_verificacion', 'verification', 'confirmado'));
      const fotoUrls = parseFotoUrls(getField(r, 'Fotos', 'fotos', 'foto_urls', 'images', 'imagenes', 'imágenes', 'links', 'fuentes', 'Fuentes'));

      const esCritico = nivelDano === 'colapsado' || nivelDano === 'critico';
      const estadoAcceso = esCritico ? 'no_entrar' : (nivelDano === 'grave' ? 'solo_rescatistas' : 'no_verificado');

      return {
        tipo_estructura: tipo,
        nombre_lugar: getField(r, 'Nombre', 'nombre_lugar', 'nombre lugar', 'name', 'lugar'),
        nivel_dano: nivelDano,
        estado_acceso: estadoAcceso,
        personas_atrapadas: getField(r, 'Atrapados', 'personas_atrapadas', 'personas atrapadas', 'trapped') || 'no_sabe',
        acceso_calle: 'no_verificado',
        acceso_vehiculos: 'no_sabe',
        electricidad: 'no_confirmado',
        agua: 'no_confirmado',
        gas: 'no_confirmado',
        riesgo_gas: normBool(getField(r, 'RiesgoGas', 'riesgo_gas', 'gas leak', 'fuga_gas')),
        riesgo_electrico: normBool(getField(r, 'RiesgoElectrico', 'riesgo_electrico', 'electrical risk')),
        riesgo_incendio: normBool(getField(r, 'RiesgoIncendio', 'riesgo_incendio', 'fire risk')),
        riesgo_colapso: esCritico,
        descripcion: getField(r, 'Notas', 'descripcion', 'descripción', 'description', 'notas', 'observaciones', 'obs'),
        direccion: getField(r, 'Direccion', 'direccion', 'dirección', 'address', 'ubicacion', 'ubicación'),
        referencia: getField(r, 'Referencia', 'referencia', 'reference', 'como_llegar'),
        ciudad: getField(r, 'Ciudad', 'ciudad', 'city'),
        estado_region: getField(r, 'Estado', 'estado_region', 'estado region', 'estado', 'state', 'region'),
        foto_urls: fotoUrls,
        prioridad: esCritico ? 'critica' : (nivelDano === 'grave' ? 'alta' : 'normal'),
        estado_verificacion: 'recibido',
        nivel_verificacion: verif,
        fuente: 'carga_masiva_admin',
        reportante_nombre: 'Admin — Carga masiva',
      };
    });

    if (solo_parsear) {
      return Response.json({ status: 'success', edificios, total: edificios.length });
    }

    // Guardar en base de datos
    const creados = [];
    const errores = [];
    for (const e of edificios) {
      try {
        const creado = await base44.asServiceRole.entities.ReportesDano.create(e);
        creados.push(creado);
      } catch (err) {
        errores.push({ nombre: e.nombre_lugar, error: err.message });
      }
    }

    return Response.json({
      status: 'success',
      total: edificios.length,
      guardados: creados.length,
      errores: errores.length,
      detalles_errores: errores,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
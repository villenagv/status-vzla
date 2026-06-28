import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

const ADMIN_EMAIL = 'villenagv@gmail.com';

// ── Normalización ──────────────────────────────────────────────────────────────
function norm(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function similitud(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wA = na.split(' '), wB = nb.split(' ');
  return wA.filter(w => w.length > 3 && wB.includes(w)).length / Math.max(wA.length, wB.length);
}

function mismoEdificio(nuevo, existente) {
  const simNombre = similitud(nuevo.nombre_lugar || '', existente.nombre_lugar || '');
  const simDir = similitud(nuevo.direccion || '', existente.direccion || '');
  const mismaCiudad = norm(nuevo.ciudad || '') === norm(existente.ciudad || '');
  if (simNombre > 0.8 && mismaCiudad) return true;
  if (simDir > 0.8 && mismaCiudad) return true;
  return false;
}

// ── Mapas de nivel de daño (CSV de Venezuela) ─────────────────────────────────
const DANO_MAP = {
  'total': 'colapsado',
  'colapso total': 'colapsado',
  'collapsed': 'colapsado',
  'severo': 'grave',
  'severe': 'grave',
  'grave': 'grave',
  'parcial': 'moderado',
  'partial': 'moderado',
  'moderado': 'moderado',
  'moderate': 'moderado',
  'leve': 'leve',
  'minor': 'leve',
  'sin danos': 'leve',
  'none': 'leve',
  'no evaluado': 'no_evaluado',
  'unknown': 'no_evaluado',
};

const VERIF_MAP = {
  'verificado': 'institucional',
  'verified': 'institucional',
  'en_revision': 'comunidad',
  'en revision': 'comunidad',
  'pendiente': 'sin_verificar',
};

function normDano(v) { return DANO_MAP[norm(v || '')] || 'no_evaluado'; }
function normVerif(v) { return VERIF_MAP[norm(v || '')] || 'sin_verificar'; }

// ── Parsear buffer como XLSX / CSV ────────────────────────────────────────────
function parsearBuffer(buffer) {
  try {
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { defval: '' });
  } catch {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n').filter(l => l.trim().length > 1);
    if (lines.length < 2) return [];
    // Detectar separador
    const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));
    return lines.slice(1).map(line => {
      const vals = [];
      let cur = '', quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { quoted = !quoted; }
        else if (ch === sep[0] && !quoted) { vals.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      vals.push(cur.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, ''); });
      return obj;
    });
  }
}

function getf(row, ...keys) {
  for (const key of keys) {
    for (const k of Object.keys(row)) {
      if (norm(k) === norm(key)) {
        const v = String(row[k] || '').trim();
        if (v && v.toLowerCase() !== 'n/a') return v;
      }
    }
  }
  return '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.email !== ADMIN_EMAIL && user.role !== 'admin') {
      return Response.json({ error: 'Solo el administrador puede usar esta función.' }, { status: 403 });
    }

    const body = await req.json();
    const { csv_url, excel_fotos_url, solo_parsear, lote, lote_size } = body;

    if (!csv_url) return Response.json({ error: 'csv_url es requerido' }, { status: 400 });

    // ── 1. DESCARGAR Y PARSEAR CSV DE EDIFICIOS ──────────────────────────────
    const csvResp = await fetch(csv_url);
    if (!csvResp.ok) return Response.json({ error: 'No se pudo descargar el CSV de edificios' }, { status: 422 });
    const csvBuffer = await csvResp.arrayBuffer();
    const csvRows = parsearBuffer(csvBuffer);

    if (csvRows.length === 0) return Response.json({ error: 'El CSV de edificios está vacío o no se pudo leer' }, { status: 422 });

    // ── 2. DESCARGAR Y PARSEAR EXCEL DE FOTOS (opcional) ──────────────────────
    // Índice: edificio_id → array de URLs (MAIN primero, luego MEDIA)
    const fotosPorEdificio = {};

    if (excel_fotos_url) {
      const xlsxResp = await fetch(excel_fotos_url);
      if (xlsxResp.ok) {
        const xlsxBuffer = await xlsxResp.arrayBuffer();
        const fotoRows = parsearBuffer(xlsxBuffer);

        for (const row of fotoRows) {
          const eid = getf(row, 'edificio_id', 'id');
          const url = getf(row, 'url_original', 'url', 'foto_url');
          const tipo = getf(row, 'tipo_foto', 'tipo');
          if (!eid || !url) continue;

          if (!fotosPorEdificio[eid]) fotosPorEdificio[eid] = { main: [], media: [] };
          if (tipo === 'MAIN') fotosPorEdificio[eid].main.push(url);
          else fotosPorEdificio[eid].media.push(url);
        }
      }
    }

    // ── 3. CONCILIAR Y NORMALIZAR ─────────────────────────────────────────────
    const edificiosNormalizados = csvRows.map(row => {
      const eid = getf(row, 'id', '\uFEFFid');
      const nivelDano = normDano(getf(row, 'damage_level', 'nivel_dano', 'nivel daño'));
      const esCritico = nivelDano === 'colapsado' || nivelDano === 'critico';

      // Fotos: main_photo_url + media_urls (del CSV) + índice Excel (si existe)
      let fotosFinales = [];

      // Desde el Excel de fotos (prioridad: MAIN primero, luego MEDIA, max 5)
      if (eid && fotosPorEdificio[eid]) {
        const { main, media } = fotosPorEdificio[eid];
        fotosFinales = [...main, ...media].slice(0, 5);
      }

      // Si no hay del Excel, usar lo que viene en el CSV (main_photo + media_urls)
      if (fotosFinales.length === 0) {
        const mainPhoto = getf(row, 'main_photo_url', 'main_photo', 'foto_principal');
        const mediaUrls = getf(row, 'media_urls', 'media', 'fotos', 'images');
        if (mainPhoto) fotosFinales.push(mainPhoto);
        if (mediaUrls) {
          const adicionales = mediaUrls.split(',').map(u => u.trim()).filter(u => u.startsWith('http'));
          for (const u of adicionales) {
            if (!fotosFinales.includes(u) && fotosFinales.length < 5) fotosFinales.push(u);
          }
        }
      }

      const ciudad = getf(row, 'city', 'ciudad');
      const direccion = getf(row, 'address', 'direccion', 'direccion');
      const zona = getf(row, 'zone', 'zona');
      const nombre = getf(row, 'name', 'nombre', 'nombre_lugar');

      // Coordenadas del CSV
      const latStr = getf(row, 'lat', 'latitud');
      const lngStr = getf(row, 'lng', 'lon', 'longitud');
      const lat = latStr ? parseFloat(latStr) : null;
      const lng = lngStr ? parseFloat(lngStr) : null;

      return {
        _eid_original: eid, // solo para tracking, no se guarda
        tipo_estructura: 'edificio_residencial',
        nombre_lugar: nombre,
        nivel_dano: nivelDano,
        estado_acceso: esCritico ? 'no_entrar' : (nivelDano === 'grave' ? 'solo_rescatistas' : 'no_verificado'),
        personas_atrapadas: 'no_sabe',
        acceso_calle: 'no_sabe', acceso_vehiculos: 'no_sabe',
        electricidad: 'no_confirmado', agua: 'no_confirmado', gas: 'no_confirmado',
        riesgo_gas: false, riesgo_electrico: false, riesgo_incendio: false,
        riesgo_colapso: esCritico,
        descripcion: getf(row, 'description', 'descripcion', 'notas', 'notes'),
        direccion: direccion,
        referencia: zona || '',
        ciudad: ciudad,
        estado_region: 'La Guaira', // default para este dataset Venezuela
        ...(lat && lng && !isNaN(lat) && !isNaN(lng) ? { lat, lng, geo_fuente: 'csv_import' } : {}),
        foto_urls: fotosFinales,
        prioridad: esCritico ? 'critica' : (nivelDano === 'grave' ? 'alta' : 'normal'),
        estado_verificacion: 'recibido',
        nivel_verificacion: normVerif(getf(row, 'status', 'estado', 'verificacion')),
        fuente: 'importacion_vzla_2026',
        reportante_nombre: 'Admin — Importación Venezuela 2026',
      };
    }).filter(e => e.nombre_lugar.length > 1);

    // ── 4. DETECCIÓN DE DUPLICADOS ─────────────────────────────────────────────
    const existentes = await base44.asServiceRole.entities.ReportesDano.list('-created_date', 3000);
    const existentesArr = existentes || [];

    const unicos = [], duplicados = [];
    for (const e of edificiosNormalizados) {
      const match = existentesArr.find(ext => mismoEdificio(e, ext));
      if (match) {
        duplicados.push({ nombre: e.nombre_lugar, ciudad: e.ciudad, nivel_dano: e.nivel_dano,
          coincideCon: { id: match.id, nombre: match.nombre_lugar, ciudad: match.ciudad } });
      } else {
        unicos.push(e);
      }
    }

    // ── 5. MODO PREVIEW ───────────────────────────────────────────────────────
    if (solo_parsear) {
      return Response.json({
        status: 'success',
        total: edificiosNormalizados.length,
        unicos: unicos.length,
        duplicados: duplicados.length,
        con_fotos: edificiosNormalizados.filter(e => e.foto_urls?.length > 0).length,
        con_coords: edificiosNormalizados.filter(e => e.lat).length,
        edificios_preview: unicos.slice(0, 20), // muestra los primeros 20
        duplicados_detalle: duplicados,
      });
    }

    // ── 6. CARGA POR LOTES ────────────────────────────────────────────────────
    const batchSize = lote_size || 50;
    const batchIndex = lote || 0;
    const slice = unicos.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
    const totalLotes = Math.ceil(unicos.length / batchSize);

    const creados = [], errores = [];
    for (const e of slice) {
      const { _eid_original, ...datos } = e;
      try {
        await base44.asServiceRole.entities.ReportesDano.create(datos);
        creados.push(e.nombre_lugar);
      } catch (err) {
        errores.push({ nombre: e.nombre_lugar, error: err.message });
      }
    }

    return Response.json({
      status: 'success',
      lote: batchIndex,
      total_lotes: totalLotes,
      hay_mas: batchIndex + 1 < totalLotes,
      guardados_este_lote: creados.length,
      total_unicos: unicos.length,
      duplicados: duplicados.length,
      errores: errores.length,
      detalles_errores: errores,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
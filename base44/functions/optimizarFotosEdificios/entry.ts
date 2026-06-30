import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Procesa descarga + subida de fotos en paralelo (10 simultáneas).
// Cada lote es pequeño (~25 edificios, ~125 fotos) para mantener la respuesta rápida.
// NO actualiza la BD — solo devuelve las URLs subidas.

const PARALELO = 4;    // descargas simultáneas — reducido para evitar 504
const MAX_FOTOS_POR_EDIFICIO = 5;
const TIMEOUT_MS = 20_000; // 20s por foto

async function fetchConTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

async function procesarUnaFoto(base44, eid, urlOriginal, tipo) {
  try {
    const resp = await fetchConTimeout(urlOriginal, TIMEOUT_MS);
    if (!resp.ok) return { edificio_id: eid, url_original: urlOriginal, status: 'error', error: `HTTP ${resp.status}` };
    const blob = await resp.blob();
    const file = new File([blob], `foto_${eid.slice(0, 8)}.jpg`, { type: blob.type || 'image/jpeg' });
    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    if (!uploadResult?.file_url) return { edificio_id: eid, url_original: urlOriginal, status: 'error', error: 'Upload falló' };
    return { edificio_id: eid, url_original: urlOriginal, status: 'ok', nueva_url: uploadResult.file_url, tipo_foto: tipo };
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timeout 30s' : err.message;
    return { edificio_id: eid, url_original: urlOriginal, status: 'error', error: msg };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { action, lote_urls, actualizar } = body;

    // ── ACCIÓN: procesar_lote ──────────────────────────────────────
    // Recibe un array de { edificio_id, url_original, tipo_foto }
    // Descarga y sube en paralelo. Devuelve resultados inmediatos.
    // Si actualizar=true, también persiste en la BD.
    if (action === 'procesar_lote') {
      if (!lote_urls || !Array.isArray(lote_urls)) {
        return Response.json({ error: 'Se requiere lote_urls array' }, { status: 400 });
      }

      // 1. Cache de edificios existentes
      const eidsUnicos = [...new Set(lote_urls.map(i => i.edificio_id).filter(Boolean))];
      const edificiosExistentes = {};
      for (const eid of eidsUnicos) {
        try { const ed = await base44.entities.ReportesDano.get(eid); if (ed) edificiosExistentes[eid] = ed; } catch {}
      }

      // 2. Filtrar duplicados — solo URLs que NO estén ya en foto_urls
      const aProcesar = [];
      for (const item of lote_urls) {
        const { edificio_id: eid, url_original: url, tipo_foto } = item;
        if (!eid || !url) continue;
        const fotosExistentes = edificiosExistentes[eid]?.foto_urls || [];
        if (fotosExistentes.includes(url)) continue;
        aProcesar.push(item);
      }

      // 3. Procesar en paralelo (chunks de PARALELO)
      const resultados = [];
      for (let i = 0; i < aProcesar.length; i += PARALELO) {
        const chunk = aProcesar.slice(i, i + PARALELO);
        const chunkRes = await Promise.all(
          chunk.map(item => procesarUnaFoto(base44, item.edificio_id, item.url_original, item.tipo_foto))
        );
        resultados.push(...chunkRes);
      }

      // 4. Agrupar nuevas URLs por edificio
      const nuevasUrlsPorEdificio = {};
      for (const r of resultados) {
        if (r.status === 'ok') {
          if (!nuevasUrlsPorEdificio[r.edificio_id]) nuevasUrlsPorEdificio[r.edificio_id] = [];
          nuevasUrlsPorEdificio[r.edificio_id].push(r.nueva_url);
        }
      }

      // 5. Actualizar BD si se solicitó
      const actualizados = [];
      if (actualizar) {
        for (const [eid, nuevas] of Object.entries(nuevasUrlsPorEdificio)) {
          try {
            const ed = edificiosExistentes[eid];
            const existentes = ed?.foto_urls || [];
            const combinadas = [...nuevas, ...existentes].slice(0, MAX_FOTOS_POR_EDIFICIO);
            await base44.entities.ReportesDano.update(eid, { foto_urls: combinadas });
            actualizados.push({ edificio_id: eid, status: 'ok', total_fotos: combinadas.length, nuevas: nuevas.length });
          } catch (err) {
            actualizados.push({ edificio_id: eid, status: 'error', error: err.message, nuevas_subidas: nuevas.length });
          }
        }
      }

      return Response.json({
        solicitadas: lote_urls.length,
        omitidos_duplicados: lote_urls.length - aProcesar.length,
        descargadas: resultados.filter(r => r.status === 'ok').length,
        errores: resultados.filter(r => r.status === 'error').length,
        actualizados: actualizados.filter(a => a.status === 'ok').length,
        errores_actualizacion: actualizados.filter(a => a.status === 'error').length,
        resultados,
        actualizados: actualizar ? actualizados : [],
      });
    }

    // ── ACCIÓN: actualizar_masivo ──────────────────────────────────
    // Recibe todas las fotos ya subidas en lotes anteriores y las persiste.
    // { fotos_subidas: [{ edificio_id, nueva_url }] }
    if (action === 'actualizar_masivo') {
      const { fotos_subidas } = body;
      if (!fotos_subidas || !Array.isArray(fotos_subidas)) {
        return Response.json({ error: 'Se requiere fotos_subidas array' }, { status: 400 });
      }

      const eidsUnicos = [...new Set(fotos_subidas.map(f => f.edificio_id).filter(Boolean))];
      const edificiosExistentes = {};
      for (const eid of eidsUnicos) {
        try { const ed = await base44.entities.ReportesDano.get(eid); if (ed) edificiosExistentes[eid] = ed; } catch {}
      }

      const nuevasUrlsPorEdificio = {};
      for (const f of fotos_subidas) {
        if (f.edificio_id && f.nueva_url) {
          if (!nuevasUrlsPorEdificio[f.edificio_id]) nuevasUrlsPorEdificio[f.edificio_id] = [];
          nuevasUrlsPorEdificio[f.edificio_id].push(f.nueva_url);
        }
      }

      const actualizados = [];
      for (const [eid, nuevas] of Object.entries(nuevasUrlsPorEdificio)) {
        try {
          const ed = edificiosExistentes[eid];
          const existentes = ed?.foto_urls || [];
          const combinadas = [...nuevas, ...existentes].slice(0, MAX_FOTOS_POR_EDIFICIO);
          await base44.entities.ReportesDano.update(eid, { foto_urls: combinadas });
          actualizados.push({ edificio_id: eid, status: 'ok', total_fotos: combinadas.length, nuevas: nuevas.length });
        } catch (err) {
          actualizados.push({ edificio_id: eid, status: 'error', error: err.message });
        }
      }

      return Response.json({ actualizados, ok: actualizados.filter(a => a.status === 'ok').length, errores: actualizados.filter(a => a.status === 'error').length });
    }

    return Response.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
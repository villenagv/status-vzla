import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Migración masiva: recorre todos los ReportesDano con foto_urls,
// detecta URLs externas (que no sean del storage interno),
// las descarga y sube al storage de Base44, y actualiza el registro.
//
// ACTION: migrar_lote — procesa un lote de edificios
//   skip: número de registros a saltar (para paginación)
//   limit: máximo a procesar (default 50)
//   solo_externas: true (default) — solo migra URLs externas
//
// ACTION: migrar_uno — migra un edificio específico
//   edificio_id: id del ReportesDano

const PARALELO = 5;   // descargas simultáneas por lote
const TIMEOUT_MS = 25_000;
const MAX_FOTOS = 5;

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

function esUrlInterna(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname.includes('base44') || u.hostname.includes('usercontent');
  } catch { return false; }
}

async function migrarUnaUrl(base44, urlOriginal) {
  if (esUrlInterna(urlOriginal)) {
    return { url_original: urlOriginal, status: 'ok', file_url: urlOriginal, accion: 'ya_interna' };
  }

  try {
    const resp = await fetchConTimeout(urlOriginal, TIMEOUT_MS);
    if (!resp.ok) return { url_original: urlOriginal, status: 'error', error: `HTTP ${resp.status}` };

    const blob = await resp.blob();
    const ext = (urlOriginal.match(/\.(jpe?g|png|gif|webp|bmp|svg)/i) || ['', 'jpg'])[1] || 'jpg';
    const filename = `migrada_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    if (!uploadResult?.file_url) return { url_original: urlOriginal, status: 'error', error: 'Upload falló' };

    return { url_original: urlOriginal, status: 'ok', file_url: uploadResult.file_url, accion: 'migrada' };
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timeout' : err.message;
    return { url_original: urlOriginal, status: 'error', error: msg };
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
    const { action, skip = 0, limit = 50, edificio_id } = body;

    // ── ACCIÓN: migrar_uno ────────────────────────────────
    if (action === 'migrar_uno') {
      if (!edificio_id) return Response.json({ error: 'Se requiere edificio_id' }, { status: 400 });

      const ed = await base44.entities.ReportesDano.get(edificio_id);
      if (!ed) return Response.json({ error: 'Edificio no encontrado' }, { status: 404 });

      const fotosActuales = (ed.foto_urls || []).filter(Boolean);
      if (fotosActuales.length === 0) {
        return Response.json({ edificio_id, accion: 'sin_fotos' });
      }

      const externas = fotosActuales.filter(u => !esUrlInterna(u));
      if (externas.length === 0) {
        return Response.json({ edificio_id, accion: 'todas_internas', fotos: fotosActuales.length });
      }

      // Migrar externas en paralelo
      const resultados = await Promise.all(
        externas.map(url => migrarUnaUrl(base44, url))
      );

      const ok = resultados.filter(r => r.status === 'ok');
      const errors = resultados.filter(r => r.status === 'error');

      if (ok.length > 0) {
        // Reconstruir el array: reemplazar URLs originales por las nuevas
        const urlMap = {};
        for (const r of ok) {
          if (r.accion === 'migrada') urlMap[r.url_original] = r.file_url;
        }
        const nuevasFotos = fotosActuales.map(u => urlMap[u] || u).slice(0, MAX_FOTOS);
        await base44.entities.ReportesDano.update(edificio_id, { foto_urls: nuevasFotos });
      }

      return Response.json({
        edificio_id,
        fotos_totales: fotosActuales.length,
        migradas: ok.length,
        errores: errors.length,
        resultados,
      });
    }

    // ── ACCIÓN: migrar_lote ────────────────────────────────
    if (action === 'migrar_lote') {
      const edificios = await base44.entities.ReportesDano.list('-updated_date', 200);

      // Filtrar solo los que tienen foto_urls
      const conFotos = edificios.filter(e => (e.foto_urls || []).length > 0);
      const lote = conFotos.slice(skip, skip + limit);

      if (lote.length === 0) {
        return Response.json({ procesados: 0, total_con_fotos: conFotos.length, fin: true });
      }

      const resultadosLote = [];
      for (const ed of lote) {
        const externas = (ed.foto_urls || []).filter(u => !esUrlInterna(u));
        if (externas.length === 0) {
          resultadosLote.push({ edificio_id: ed.id, nombre: ed.nombre_lugar, accion: 'todas_internas', fotos: (ed.foto_urls || []).length });
          continue;
        }

        // Migrar en paralelo (máx PARALELO a la vez)
        const resultados = [];
        for (let i = 0; i < externas.length; i += PARALELO) {
          const chunk = externas.slice(i, i + PARALELO);
          const chunkRes = await Promise.all(chunk.map(url => migrarUnaUrl(base44, url)));
          resultados.push(...chunkRes);
          // Pequeña pausa entre chunks
          await new Promise(r => setTimeout(r, 100));
        }

        const ok = resultados.filter(r => r.status === 'ok');
        const errors = resultados.filter(r => r.status === 'error');

        if (ok.length > 0) {
          const urlMap = {};
          for (const r of ok) {
            if (r.accion === 'migrada') urlMap[r.url_original] = r.file_url;
          }
          const nuevasFotos = (ed.foto_urls || []).map(u => urlMap[u] || u).slice(0, MAX_FOTOS);
          await base44.entities.ReportesDano.update(ed.id, { foto_urls: nuevasFotos });
        }

        resultadosLote.push({
          edificio_id: ed.id,
          nombre: ed.nombre_lugar,
          fotos_totales: (ed.foto_urls || []).length,
          migradas: ok.length,
          errores: errors.length,
        });
      }

      // Verificar si quedan más
      const mas = conFotos.length > skip + limit;

      return Response.json({
        procesados: resultadosLote.length,
        lote: skip / limit + 1,
        skip,
        limit,
        total_con_fotos: conFotos.length,
        quedan_mas: mas,
        resultados: resultadosLote,
        total_migradas: resultadosLote.reduce((s, r) => s + (r.migradas || 0), 0),
        total_errores: resultadosLote.reduce((s, r) => s + (r.errores || 0), 0),
      });
    }

    // ── ACCIÓN: contar ─────────────────────────────────────
    // Cuenta cuántos edificios tienen fotos y cuántas externas
    if (action === 'contar') {
      const edificios = await base44.entities.ReportesDano.list('-updated_date', 200);
      const conFotos = edificios.filter(e => (e.foto_urls || []).length > 0);
      let totalFotos = 0;
      let externas = 0;
      let internas = 0;
      let edificiosConExternas = 0;

      for (const ed of conFotos) {
        const fotos = ed.foto_urls || [];
        totalFotos += fotos.length;
        for (const url of fotos) {
          if (esUrlInterna(url)) internas++;
          else externas++;
        }
        if (fotos.some(u => !esUrlInterna(u))) edificiosConExternas++;
      }

      return Response.json({
        total_edificios: edificios.length,
        con_fotos: conFotos.length,
        total_fotos: totalFotos,
        fotos_internas: internas,
        fotos_externas: externas,
        edificios_con_externas: edificiosConExternas,
      });
    }

    return Response.json({ error: 'Acción no válida. Usar: contar, migrar_lote, migrar_uno' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
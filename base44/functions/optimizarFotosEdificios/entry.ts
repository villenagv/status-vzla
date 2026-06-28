import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Para procesar imágenes sin dependencias externas:
// Deno tiene soporte nativo para canvas (opcional) — usamos fetch + blob directo
// y subimos el archivo tal cual. La compresión real ocurre al subir a nuestro
// CDN (auto-optimización de imágenes en entrega).

const MAX_FOTOS_POR_EDIFICIO = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { action, lote_urls } = body;

    if (action === 'procesar_lote') {
      if (!lote_urls || !Array.isArray(lote_urls)) {
        return Response.json({ error: 'Se requiere lote_urls array' }, { status: 400 });
      }

      // Cache: cargar todos los edificios involucrados de una sola vez
      const eidsUnicos = [...new Set(lote_urls.map(i => i.edificio_id).filter(Boolean))];

      // Obtener edificios existentes en una sola consulta
      const edificiosExistentes = {};
      for (const eid of eidsUnicos) {
        try {
          const ed = await base44.entities.ReportesDano.get(eid);
          if (ed) edificiosExistentes[eid] = ed;
        } catch {
          // no existe
        }
      }

      // Agrupar URLs por edificio y deduplicar
      const urlsPorEdificio = {};
      for (const item of lote_urls) {
        const eid = item.edificio_id;
        if (!eid || !item.url_original) continue;
        if (!urlsPorEdificio[eid]) urlsPorEdificio[eid] = new Set();

        // Verificar si la URL ya está asociada al edificio
        const ed = edificiosExistentes[eid];
        const fotosExistentes = ed?.foto_urls || [];
        if (fotosExistentes.includes(item.url_original)) continue; // ya existe, skip

        urlsPorEdificio[eid].add(item.url_original);
      }

      // Procesar: subir archivos y actualizar
      const resultados = [];
      const actualizados = [];

      for (const [eid, urlsSet] of Object.entries(urlsPorEdificio)) {
        const urls = [...urlsSet];
        const nuevasUrls = [];

        for (const urlOriginal of urls) {
          try {
            // Descargar imagen
            const resp = await fetch(urlOriginal);
            if (!resp.ok) {
              resultados.push({ edificio_id: eid, url_original: urlOriginal, status: 'error', error: `HTTP ${resp.status}` });
              continue;
            }
            const blob = await resp.blob();

            // Subir a almacenamiento — UploadFile a secas sin redimension
            const file = new File([blob], `foto_${eid.slice(0, 8)}.jpg`, { type: blob.type || 'image/jpeg' });
            const uploadResult = await base44.integrations.Core.UploadFile({ file });

            if (!uploadResult?.file_url) {
              resultados.push({ edificio_id: eid, url_original: urlOriginal, status: 'error', error: 'Upload falló' });
              continue;
            }

            nuevasUrls.push(uploadResult.file_url);
            resultados.push({ edificio_id: eid, url_original: urlOriginal, status: 'ok', nueva_url: uploadResult.file_url });
          } catch (err) {
            resultados.push({ edificio_id: eid, url_original: urlOriginal, status: 'error', error: err.message });
          }
        }

        // Actualizar edificio si hay nuevas fotos
        if (nuevasUrls.length > 0) {
          try {
            const ed = edificiosExistentes[eid];
            const existentes = ed?.foto_urls || [];
            const combinadas = [...nuevasUrls, ...existentes].slice(0, MAX_FOTOS_POR_EDIFICIO);
            await base44.entities.ReportesDano.update(eid, { foto_urls: combinadas });
            actualizados.push({ edificio_id: eid, status: 'ok', total_fotos: combinadas.length, nuevas: nuevasUrls.length });
          } catch (err) {
            actualizados.push({ edificio_id: eid, status: 'error', error: err.message, nuevas_subidas: nuevasUrls.length });
          }
        }
      }

      return Response.json({
        total_solicitadas: lote_urls.length,
        descargadas: resultados.filter(r => r.status === 'ok').length,
        errores_descarga: resultados.filter(r => r.status === 'error').length,
        actualizados: actualizados.filter(a => a.status === 'ok').length,
        errores_actualizacion: actualizados.filter(a => a.status === 'error').length,
        resultados,
        actualizados,
      });
    }

    return Response.json({ error: 'Acción no válida. Usa: procesar_lote' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
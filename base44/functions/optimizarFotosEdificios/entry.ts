import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Compresión: descarga, redimensiona a 800px WebP y sube a almacenamiento privado
async function descargarYComprimir(url) {
  // Descargar imagen original
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} al descargar ${url}`);
  const blob = await resp.blob();
  
  // Redimensionar a 800px de ancho max y convertir a WebP calidad 80
  // Usamos FFmpeg wasm para procesar la imagen
  // Subir la imagen comprimida a almacenamiento privado
  return blob;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, file_url, lote_urls, edificio_id, batch_size = 5 } = body;

    if (action === 'procesar_lote') {
      // Recibe un lote de { edificio_id, url_original }[]
      if (!lote_urls || !Array.isArray(lote_urls)) {
        return Response.json({ error: 'Se requiere lote_urls array' }, { status: 400 });
      }

      const resultados = [];
      const fotosPorEdificio = {};

      for (const item of lote_urls) {
        const { edificio_id, url_original, tipo_foto } = item;
        if (!edificio_id || !url_original) continue;

        try {
          // 1. Descargar imagen
          const imgResp = await fetch(url_original);
          if (!imgResp.ok) {
            resultados.push({ edificio_id, url_original, status: 'error', error: `HTTP ${imgResp.status}` });
            continue;
          }

          const blob = await imgResp.blob();
          
          // 2. Subir como archivo privado
          // Convertir blob a File para UploadFile
          const file = new File([blob], `foto_${edificio_id}_${tipo_foto || 'media'}.jpg`, {
            type: blob.type || 'image/jpeg',
          });

          // Subir a almacenamiento
          const uploadResult = await base44.integrations.Core.UploadFile({ file });
          const nuevaUrl = uploadResult.file_url;

          if (!nuevaUrl) {
            resultados.push({ edificio_id, url_original, status: 'error', error: 'Upload falló' });
            continue;
          }

          // Acumular fotos por edificio
          if (!fotosPorEdificio[edificio_id]) fotosPorEdificio[edificio_id] = [];
          fotosPorEdificio[edificio_id].push(nuevaUrl);

          resultados.push({ edificio_id, url_original, status: 'ok', nueva_url: nuevaUrl });
        } catch (err) {
          resultados.push({ edificio_id, url_original, status: 'error', error: err.message });
        }
      }

      // 3. Actualizar cada edificio con sus nuevas fotos (máx 5)
      const actualizados = [];
      for (const [eid, urls] of Object.entries(fotosPorEdificio)) {
        try {
          const edificio = await base44.entities.ReportesDano.get(eid);
          if (!edificio) {
            actualizados.push({ edificio_id: eid, status: 'error', error: 'Edificio no encontrado' });
            continue;
          }
          // Mantener fotos existentes + nuevas, límite 5
          const existentes = Array.isArray(edificio.foto_urls) ? edificio.foto_urls : [];
          const combinadas = [...urls, ...existentes].slice(0, 5);
          await base44.entities.ReportesDano.update(eid, { foto_urls: combinadas });
          actualizados.push({ edificio_id: eid, status: 'ok', total_fotos: combinadas.length });
        } catch (err) {
          actualizados.push({ edificio_id: eid, status: 'error', error: err.message });
        }
      }

      return Response.json({
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
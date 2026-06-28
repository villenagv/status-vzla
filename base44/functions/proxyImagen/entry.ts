import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Proxy de imágenes: recibe una URL externa, la descarga, la sube al storage
// interno de Base44 y devuelve la nueva URL permanente.
// También sirve como endpoint GET para servir imágenes cacheadas.
//
// USO DESDE FRONTEND:
//   const resp = await base44.functions.invoke('proxyImagen', { url: 'https://...' });
//   // resp.data.file_url = URL interna del storage
//
// USO DESDE API (GET):
//   GET /api/proxyImagen?url=https%3A%2F%2F...
//   → Redirecciona 302 a la imagen servida directamente

const TIMEOUT_MS = 25_000;
const CACHE_SECONDS = 300; // 5 min para signed URLs

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
    // URLs de Base44 storage
    return u.hostname.includes('base44') || u.hostname.includes('base44usercontent')
      || u.hostname.includes('base44usercontent.com') || u.hostname.includes('usercontent');
  } catch { return false; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const urlObj = new URL(req.url);

    // ── MODO GET: proxy directo (redirección) ──
    if (req.method === 'GET') {
      const targetUrl = urlObj.searchParams.get('url');
      if (!targetUrl) {
        return Response.json({ error: 'Se requiere parámetro url' }, { status: 400 });
      }

      // Si ya es interna, redirigir directo
      if (esUrlInterna(targetUrl)) {
        return Response.redirect(targetUrl, 302);
      }

      try {
        const resp = await fetchConTimeout(targetUrl, TIMEOUT_MS);
        if (!resp.ok) {
          return Response.json({ error: `Error al obtener imagen: HTTP ${resp.status}` }, { status: 502 });
        }

        const contentType = resp.headers.get('content-type') || 'image/jpeg';
        const blob = await resp.blob();

        return new Response(blob, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err) {
        return Response.json({ error: `Error al descargar: ${err.message}` }, { status: 502 });
      }
    }

    // ── MODO POST: subir al storage interno ──
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return Response.json({ error: 'Se requiere campo "url"' }, { status: 400 });
    }

    // Si ya es interna, devolverla directamente
    if (esUrlInterna(url)) {
      return Response.json({ file_url: url, origen: 'ya_interna' });
    }

    // Descargar y subir
    const resp = await fetchConTimeout(url, TIMEOUT_MS);
    if (!resp.ok) {
      return Response.json({ error: `HTTP ${resp.status} al descargar imagen` }, { status: 502 });
    }

    const blob = await resp.blob();
    const ext = (url.match(/\.(jpe?g|png|gif|webp|bmp|svg)/i) || ['', 'jpg'])[1] || 'jpg';
    const filename = `proxy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    if (!uploadResult?.file_url) {
      return Response.json({ error: 'Error al subir imagen al storage' }, { status: 500 });
    }

    return Response.json({
      file_url: uploadResult.file_url,
      origen: 'proxy_subida',
      url_original: url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
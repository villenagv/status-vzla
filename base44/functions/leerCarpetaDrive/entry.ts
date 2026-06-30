import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Lee archivos de una carpeta de Google Drive usando el conector OAuth autorizado.
// Devuelve lista de archivos con nombre, id y URL exportable (thumbnail / webContentLink).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { folder_id, page_token } = await req.json();
    if (!folder_id) {
      return Response.json({ error: 'folder_id es requerido' }, { status: 400 });
    }

    // Obtener token de acceso de Google Drive desde el conector
    const conn = await base44.asServiceRole.connectors.getConnection('googledrive');
    if (!conn?.access_token) {
      return Response.json({ error: 'Google Drive no está conectado. Conecta el conector en la configuración.' }, { status: 403 });
    }

    const accessToken = conn.access_token;

    // Listar archivos de imagen en la carpeta
    const mimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ].map(m => `mimeType='${m}'`).join(' or ');

    let url = `https://www.googleapis.com/drive/v3/files?q=(${mimeTypes}) and '${folder_id}' in parents and trashed=false&fields=files(id,name,mimeType,thumbnailLink,webContentLink,size),nextPageToken&pageSize=100`;
    if (page_token) url += `&pageToken=${page_token}`;

    const driveResp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!driveResp.ok) {
      const errText = await driveResp.text();
      return Response.json({ error: `Error de Drive: ${driveResp.status} — ${errText}` }, { status: driveResp.status });
    }

    const driveData = await driveResp.json();
    const archivos = (driveData.files || []).map((f) => ({
      id: f.id,
      nombre: f.name,
      mime: f.mimeType,
      size: f.size,
      thumbnail: f.thumbnailLink || null,
      // URL directa de descarga con access_token adjunto para uso interno
      url_descarga: `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`,
    }));

    return Response.json({
      status: 'success',
      total: archivos.length,
      next_page_token: driveData.nextPageToken || null,
      archivos,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
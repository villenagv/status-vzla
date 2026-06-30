import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Lee archivos de imagen en una carpeta de Google Drive.
// Requiere scope drive.readonly autorizado en el conector compartido.

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

    // getConnection devuelve { accessToken, connectionConfig }
    const conn = await base44.asServiceRole.connectors.getConnection('googledrive');
    const accessToken = conn?.accessToken;
    if (!accessToken) {
      return Response.json({ error: 'Google Drive no está conectado o el token no está disponible.' }, { status: 403 });
    }

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
      return Response.json({ error: `Error de Drive API: ${driveResp.status} — ${errText}` }, { status: driveResp.status });
    }

    const driveData = await driveResp.json();
    const archivos = (driveData.files || []).map((f) => ({
      id: f.id,
      nombre: f.name,
      mime: f.mimeType,
      size: f.size,
      thumbnail: f.thumbnailLink || null,
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
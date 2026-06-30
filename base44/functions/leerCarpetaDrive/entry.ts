import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Lee archivos de una carpeta de Google Drive usando el conector OAuth autorizado.
// Devuelve lista de archivos con nombre, id y URL exportable (thumbnail / webContentLink).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar auth — puede fallar si el token expiró
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      return Response.json({ error: `Auth error: ${e.message}` }, { status: 401 });
    }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: `No autorizado. Role recibido: ${user?.role || 'ninguno'}` }, { status: 403 });
    }

    const body = await req.json();
    const { folder_id, page_token } = body;
    if (!folder_id) {
      return Response.json({ error: 'folder_id es requerido' }, { status: 400 });
    }

    // Obtener token de acceso de Google Drive desde el conector
    let conn = null;
    try {
      conn = await base44.asServiceRole.connectors.getConnection('googledrive');
    } catch (e) {
      return Response.json({ error: `Error al obtener conector Drive: ${e.message}` }, { status: 500 });
    }
    if (!conn?.access_token) {
      return Response.json({ error: 'Google Drive no está conectado. Ve a Configuración → Conectores y conecta Google Drive.' }, { status: 403 });
    }

    // Diagnóstico: confirmar scopes disponibles
    const connScopes = conn.scopes || conn.scope || 'no disponible';
    const hasReadScope = typeof connScopes === 'string'
      ? (connScopes.includes('drive.readonly') || connScopes.includes('drive') || connScopes.includes('drive.file'))
      : true;

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
      return Response.json({
        error: `Error de Drive API: ${driveResp.status} — ${errText}`,
        debug: { folder_id, conn_scopes: connScopes, has_read_scope: hasReadScope }
      }, { status: driveResp.status });
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
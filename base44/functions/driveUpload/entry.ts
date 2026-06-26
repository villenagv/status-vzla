import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Folder structure: status app / {category} / {caseId}
// category: emergencias | edificios | personas | puntos-ayuda

const ROOT_FOLDER_NAME = 'status app';

async function findOrCreateFolder(accessToken, name, parentId = null) {
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  const parentQuery = parentId ? ` and '${parentId}' in parents` : ` and 'root' in parents`;
  const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false${parentQuery}`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const searchRes = await fetch(searchUrl, { headers });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const body = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) body.parents = [parentId];
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const created = await createRes.json();
  return created.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const formData = await req.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'emergencias'; // emergencias | edificios | personas | puntos-ayuda
    const caseId = formData.get('caseId') || 'sin-id';
    const caseLabel = formData.get('caseLabel') || caseId;

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Build folder hierarchy: status app / category / case
    const rootId = await findOrCreateFolder(accessToken, ROOT_FOLDER_NAME);
    const categoryId = await findOrCreateFolder(accessToken, category, rootId);
    const caseId_folder = await findOrCreateFolder(accessToken, caseLabel, categoryId);

    // Upload file via multipart
    const boundary = '-------314159265358979323846';
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    const metadata = JSON.stringify({ name: file.name, parents: [caseId_folder] });
    const enc = new TextEncoder();

    const parts = [
      enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
      enc.encode(`--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`),
      fileBytes,
      enc.encode(`\r\n--${boundary}--`),
    ];

    let totalLength = 0;
    for (const p of parts) totalLength += p.length;
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const p of parts) { body.set(p, offset); offset += p.length; }

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
          'Content-Length': String(totalLength),
        },
        body,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return Response.json({ error: 'Drive upload failed', details: err }, { status: 500 });
    }

    const uploaded = await uploadRes.json();
    return Response.json({ success: true, fileId: uploaded.id, name: uploaded.name, viewUrl: uploaded.webViewLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
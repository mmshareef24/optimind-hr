import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderName, searchQuery } = await req.json();
    const folder = folderName || 'HRMS Documents';

    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Find the folder
    const folderSearchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folder}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const folderSearch = await folderSearchRes.json();

    if (!folderSearch.files || folderSearch.files.length === 0) {
      return Response.json({ files: [], message: 'No folder found' });
    }

    const folderId = folderSearch.files[0].id;

    // List files in folder
    let query = `'${folderId}' in parents and trashed=false`;
    if (searchQuery) {
      query += ` and name contains '${searchQuery}'`;
    }

    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,webContentLink,mimeType,size,createdTime,description)&orderBy=createdTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const filesData = await filesRes.json();

    return Response.json({
      files: filesData.files || [],
      folderId: folderId
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
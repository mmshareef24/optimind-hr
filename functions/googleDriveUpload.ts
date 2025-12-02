import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const folderName = formData.get('folderName') || 'HRMS Documents';
    const documentType = formData.get('documentType') || 'other';
    const description = formData.get('description') || '';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // First, check if folder exists or create it
    const folderSearchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const folderSearch = await folderSearchRes.json();
    
    let folderId;
    if (folderSearch.files && folderSearch.files.length > 0) {
      folderId = folderSearch.files[0].id;
    } else {
      // Create folder
      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      const newFolder = await createFolderRes.json();
      folderId = newFolder.id;
    }

    // Upload file to Google Drive
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    const metadata = {
      name: file.name,
      parents: [folderId],
      description: description
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType,size,createdTime',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      }
    );

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      return Response.json({ error: 'Failed to upload to Google Drive', details: errorText }, { status: 500 });
    }

    const uploadedFile = await uploadRes.json();

    return Response.json({
      success: true,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webViewLink: uploadedFile.webViewLink,
        webContentLink: uploadedFile.webContentLink,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        createdTime: uploadedFile.createdTime,
        folderId: folderId
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
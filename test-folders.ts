export async function getOrCreatePath(token: string, rootFolderId: string, path: string[]): Promise<string> {
  let currentFolderId = rootFolderId;
  for (const folderName of path) {
    if (!folderName) continue;
    const query = encodeURIComponent(
      `name = '${folderName.replace(/'/g, "\\'")}' and '${currentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      currentFolderId = data.files[0].id;
    } else {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId]
        })
      });
      const createData = await createRes.json();
      currentFolderId = createData.id;
    }
  }
  return currentFolderId;
}

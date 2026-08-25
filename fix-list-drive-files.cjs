const fs = require('fs');
const path = 'src/lib/googleDriveSync.ts';
let content = fs.readFileSync(path, 'utf8');

const oldFunc = `export async function listDriveFiles(parentFolderId?: string): Promise<DriveBackupFile[]> {
  const token = await requestDriveAccessToken();
  const folderId = parentFolderId || await getOrCreateAppFolder(token);

  const query = encodeURIComponent(\`'\${folderId}' in parents and trashed = false\`);
  const res = await fetch(
    \`https://www.googleapis.com/drive/v3/files?q=\${query}&fields=files(id, name, mimeType, size, createdTime, modifiedTime)&orderBy=folder, modifiedTime desc\`,
    {
      headers: { Authorization: \`Bearer \${token}\` },
    }
  );

  if (!res.ok) {
    if (res.status === 401) {
      disconnectDrive();
      throw new Error('Google Drive authorization expired. Please reconnect.');
    }
    throw new Error('Failed to list files from Google Drive.');
  }

  const data = await res.json();
  const files: DriveBackupFile[] = (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? \`\${(parseInt(f.size, 10) / 1024).toFixed(1)} KB\` : undefined,
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    isFullBackup: f.name === BACKUP_FILENAME,
    isFolder: f.mimeType === 'application/vnd.google-apps.folder',
  }));

  return files;
}`;

const newFunc = `export async function listDriveFiles(parentFolderId?: string): Promise<DriveBackupFile[]> {
  const token = await requestDriveAccessToken();
  const folderId = parentFolderId || await getOrCreateAppFolder(token);

  const query = encodeURIComponent(\`'\${folderId}' in parents and trashed = false\`);
  const res = await fetch(
    \`https://www.googleapis.com/drive/v3/files?q=\${query}&fields=files(id, name, mimeType, size, createdTime, modifiedTime)&orderBy=folder, modifiedTime desc\`,
    {
      headers: { Authorization: \`Bearer \${token}\` },
    }
  );

  if (!res.ok) {
    if (res.status === 401) {
      disconnectDrive();
      throw new Error('Google Drive authorization expired. Please reconnect.');
    }
    throw new Error('Failed to list files from Google Drive.');
  }

  const data = await res.json();
  const rawFiles = (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? \`\${(parseInt(f.size, 10) / 1024).toFixed(1)} KB\` : undefined,
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    isFullBackup: f.name === BACKUP_FILENAME,
    isFolder: f.mimeType === 'application/vnd.google-apps.folder',
  }));

  const validFiles: DriveBackupFile[] = [];
  
  for (const f of rawFiles) {
    if (f.isFolder) {
      try {
        const childQuery = encodeURIComponent(\`'\${f.id}' in parents and trashed = false\`);
        const childRes = await fetch(
          \`https://www.googleapis.com/drive/v3/files?q=\${childQuery}&fields=files(id)&pageSize=1\`,
          { headers: { Authorization: \`Bearer \${token}\` } }
        );
        if (childRes.ok) {
          const childData = await childRes.json();
          if (childData.files && childData.files.length > 0) {
            validFiles.push(f);
          } else {
            // Folder is empty, delete it from Google Drive
            await deleteDriveFile(f.id);
          }
        } else {
          validFiles.push(f);
        }
      } catch (err) {
        console.warn('Error checking folder children:', err);
        validFiles.push(f);
      }
    } else {
      validFiles.push(f);
    }
  }

  return validFiles;
}`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replaced listDriveFiles');
} else {
  console.log('Could not find oldFunc exact match.');
}

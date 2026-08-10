import { useStore } from '../store/useStore';

const FOLDER_NAME = 'Mockly';
const FILE_NAME = 'mock-test-storage-v2.json';

async function getOrCreateFolder(token: string): Promise<string | null> {
  // Try to find the folder
  const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`);
  let res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) return null;
  let data = await res.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  
  // Create the folder if it doesn't exist
  const metadata = {
    name: FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
    parents: ['root']
  };
  
  res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  
  if (!res.ok) return null;
  data = await res.json();
  return data.id;
}

async function findFileId(token: string, folderId: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

export async function loadFromDrive(token: string) {
  try {
    const folderId = await getOrCreateFolder(token);
    if (!folderId) return;

    const fileId = await findFileId(token, folderId);
    if (!fileId) return;
    
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const text = await res.text();
    const data = JSON.parse(text);
    
    if (data && data.state) {
      useStore.setState(data.state);
    }
  } catch (e) {
    console.error('Failed to load from Drive', e);
  }
}

let syncTimeout: any;

export async function saveToDrive(token: string, state: any) {
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      const folderId = await getOrCreateFolder(token);
      if (!folderId) return;

      let fileId = await findFileId(token, folderId);
      
      const value = JSON.stringify({ state, version: 0 }); // Matches zustand persist format
      const file = new Blob([value], { type: 'application/json' });
      
      if (fileId) {
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME })], { type: 'application/json' }));
        form.append('file', file);
        const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('Failed to PATCH to Drive:', res.status, err);
        }
      } else {
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME, parents: [folderId] })], { type: 'application/json' }));
        form.append('file', file);
        const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('Failed to POST to Drive:', res.status, err);
        }
      }
    } catch (e) {
      console.error('Failed to save to Drive', e);
    }
  }, 2000);
}

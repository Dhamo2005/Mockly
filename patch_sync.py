import re

with open("src/lib/sqliteDriveSync.ts", "r", encoding="utf-8") as f:
    code = f.read()

# I want to add a global flag `let driveSyncDisabled = false;`
# And check it before `if (!token) return;`

patch = """let driveSyncDisabled = false;

export async function saveSQLiteToDrive(token: string | null, state: any, immediate = false) {
  try {
    if (!SQL) await initSQLiteEngine();
    if (!db) {
      db = new SQL!.Database();
      createTables();
    }
    
    const performLocalExport = async (currentState: any) => {
      try {
        saveStateToDB(currentState);
        const binaryData = db!.export();
        await saveSQLiteToIDB(binaryData);
      } catch (e) {
        console.warn('IDB export failed:', e);
      }
    };

    // Fast local IndexedDB writes
    if (immediate) {
      if (localSaveTimeout) clearTimeout(localSaveTimeout);
      await performLocalExport(state);
    } else {
      if (localSaveTimeout) clearTimeout(localSaveTimeout);
      localSaveTimeout = setTimeout(async () => {
        localSaveTimeout = null;
        await performLocalExport(useStore.getState());
      }, 500);
    }

    // 2. If Google token is provided, sync SQLite file to Google Drive
    if (!token || driveSyncDisabled) return;
"""

code = re.sub(r'export async function saveSQLiteToDrive\(token:[^{]+{([^/]|/(?!/ 2\. If))+// 2\. If Google token is provided, sync SQLite file to Google Drive\s*if \(!token\) return;', patch, code)

# In getOrCreateFolder we want to catch 401/403 and set driveSyncDisabled
patch_folder = """async function getOrCreateFolder(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`);
  let res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401 || res.status === 403) {
    driveSyncDisabled = true;
    return null;
  }
  if (!res.ok) return null;"""

code = re.sub(r'async function getOrCreateFolder\(token:[^{]+{[^}]+if \(!res\.ok\) return null;', patch_folder, code)


with open("src/lib/sqliteDriveSync.ts", "w", encoding="utf-8") as f:
    f.write(code)

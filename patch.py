import sys

with open('src/lib/sqliteDriveSync.ts', 'r') as f:
    code = f.read()

code = code.replace(
"""let syncTimeout: any;
let isSyncing = false;
let needsSync = false;""",
"""let localSaveTimeout: any;
let syncTimeout: any;
let isSyncing = false;
let needsSync = false;"""
)

code = code.replace(
"""    // 1. Always update SQLite DB in memory and persist binary to IndexedDB locally
    saveStateToDB(state);
    const binaryData = db.export();
    await saveSQLiteToIDB(binaryData);

    // 2. If Google token is provided, sync SQLite file to Google Drive
    if (!token) return;
    
    if (isSyncing) {
      needsSync = true;
      return;
    }

    if (syncTimeout) clearTimeout(syncTimeout);""",
"""    // 1. Always update SQLite DB in memory (fast)
    saveStateToDB(state);
    
    const performLocalExport = async () => {
      const binaryData = db!.export();
      await saveSQLiteToIDB(binaryData);
    };

    // Throttle local IndexedDB writes to 3 seconds to avoid UI stutter
    if (immediate) {
      if (localSaveTimeout) clearTimeout(localSaveTimeout);
      await performLocalExport();
    } else {
      if (!localSaveTimeout) {
        localSaveTimeout = setTimeout(async () => {
          localSaveTimeout = null;
          await performLocalExport();
        }, 3000);
      }
    }

    // 2. If Google token is provided, sync SQLite file to Google Drive
    if (!token) return;
    
    if (isSyncing) {
      needsSync = true;
      return;
    }"""
)

code = code.replace(
"""    if (immediate) {
      performSync();
    } else {
      syncTimeout = setTimeout(performSync, 1500);
    }""",
"""    // Throttle Google Drive uploads to 15 seconds to avoid rate limits
    if (immediate) {
      if (syncTimeout) clearTimeout(syncTimeout);
      performSync();
    } else {
      if (!syncTimeout) {
        syncTimeout = setTimeout(() => {
          syncTimeout = null;
          performSync();
        }, 15000);
      }
    }"""
)

with open('src/lib/sqliteDriveSync.ts', 'w') as f:
    f.write(code)


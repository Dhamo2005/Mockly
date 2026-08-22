import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import localforage from 'localforage';
// @ts-ignore - Vite specific import for the WASM asset
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SCHEMA_SQL, TRIGGERS_SQL, SEED_SQL } from '../db/schema';

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

const DB_KEY = 'mockly_sqlite_db';

export const initDB = async (dbBytes?: Uint8Array, reset: boolean = false): Promise<Database> => {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl
    });
  }

  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }

  if (reset) {
    await localforage.removeItem(DB_KEY);
  } else if (!dbBytes) {
    // Try to load from localforage if no explicit bytes provided
    const localBytes = await localforage.getItem<Uint8Array>(DB_KEY);
    if (localBytes) {
      dbBytes = localBytes;
    }
  }

  if (dbBytes) {
    dbInstance = new SQL.Database(dbBytes);
    // Ensure triggers are present (in case they were updated)
    dbInstance.exec(TRIGGERS_SQL);
  } else {
    dbInstance = new SQL.Database();
    // Initialize schema
    dbInstance.exec(SCHEMA_SQL);
    dbInstance.exec(TRIGGERS_SQL);
    dbInstance.exec(SEED_SQL);
    await saveDBLocally();
  }
  
  return dbInstance;
};

export const getDB = (): Database => {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return dbInstance;
};

export const exportDB = (): Uint8Array => {
  const db = getDB();
  return db.export();
};

export const saveDBLocally = async (): Promise<void> => {
  const bytes = exportDB();
  await localforage.setItem(DB_KEY, bytes);
};

import { loadDatabaseFromDrive, saveDatabaseToDrive, isDriveConnected } from './googleDriveSync';

export const syncDBToDrive = async (): Promise<void> => {
  if (isDriveConnected()) {
    const bytes = exportDB();
    await saveDatabaseToDrive(bytes);
  }
};

export const syncDBFromDrive = async (): Promise<boolean> => {
  if (isDriveConnected()) {
    const bytes = await loadDatabaseFromDrive();
    if (bytes) {
      await initDB(bytes);
      await saveDBLocally();
      return true;
    }
  }
  return false;
};


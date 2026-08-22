import firebaseConfig from '../../firebase-applet-config.json';
import { Test, TestAttempt } from '../types';

export interface DriveBackupFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  isFullBackup?: boolean;
}

export interface DriveBackupPayload {
  version: number;
  appName: string;
  timestamp: number;
  backupDate: string;
  tests: Test[];
  attempts: TestAttempt[];
  settings?: any;
}

const FOLDER_NAME = 'Mockly App Data';
const BACKUP_FILENAME = 'mockly_full_backup.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  firebaseConfig.oAuthClientId ||
  '449615236612-atqbkv0qddttm4r61do61ad0m64nsp3u.apps.googleusercontent.com';

const STORAGE_KEY_TOKEN = 'mockly_gdrive_access_token';
const STORAGE_KEY_EXPIRY = 'mockly_gdrive_token_expiry';
const STORAGE_KEY_AUTO_SYNC = 'mockly_gdrive_auto_sync';
const STORAGE_KEY_LAST_SYNC = 'mockly_gdrive_last_sync';
const STORAGE_KEY_FOLDER_ID = 'mockly_gdrive_folder_id';

let tokenClientInstance: any = null;
let activeFolderId: string | null = localStorage.getItem(STORAGE_KEY_FOLDER_ID);
const fileIdCache = new Map<string, string>();

/**
 * Checks if the stored access token is still valid.
 */
export function getValidDriveToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiryStr = localStorage.getItem(STORAGE_KEY_EXPIRY);

  if (!token || !expiryStr) return null;

  const expiry = parseInt(expiryStr, 10);
  // Give a 60-second buffer
  if (Date.now() >= expiry - 60000) {
    return null;
  }

  return token;
}

export function isDriveConnected(): boolean {
  return getValidDriveToken() !== null;
}

export function getDriveAutoSync(): boolean {
  return localStorage.getItem(STORAGE_KEY_AUTO_SYNC) === 'true';
}

export function setDriveAutoSync(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY_AUTO_SYNC, enabled ? 'true' : 'false');
}

export function getDriveLastSync(): number | null {
  const val = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  return val ? parseInt(val, 10) : null;
}

export function disconnectDrive() {
  const token = getValidDriveToken();
  if (token && typeof (window as any).google?.accounts?.oauth2?.revoke === 'function') {
    try {
      (window as any).google.accounts.oauth2.revoke(token, () => {});
    } catch {
      // Ignore revocation error
    }
  }
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRY);
  localStorage.removeItem(STORAGE_KEY_FOLDER_ID);
}

/**
 * Request access token from Google Identity Services
 */
export async function requestDriveAccessToken(forcePrompt = false): Promise<string> {
  const validToken = getValidDriveToken();
  if (validToken && !forcePrompt) {
    return validToken;
  }

  return new Promise((resolve, reject) => {
    const checkGSI = () => {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        return false;
      }
      return true;
    };

    const initClientAndRequest = () => {
      const google = (window as any).google;
      try {
        tokenClientInstance = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPE,
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }

            if (response.access_token) {
              const expiresIn = (response.expires_in || 3599) * 1000;
              const expiryTime = Date.now() + expiresIn;

              localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
              localStorage.setItem(STORAGE_KEY_EXPIRY, expiryTime.toString());

              resolve(response.access_token);
            } else {
              reject(new Error('No access token received from Google'));
            }
          },
        });

        tokenClientInstance.requestAccessToken({ prompt: forcePrompt ? 'consent' : '' });
      } catch (err) {
        reject(err);
      }
    };

    if (checkGSI()) {
      initClientAndRequest();
    } else {
      // Retry for up to 3 seconds in case script is loading
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkGSI()) {
          clearInterval(interval);
          initClientAndRequest();
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Google Identity Services SDK failed to load. Please check your connection.'));
        }
      }, 100);
    }
  });
}

/**
 * Finds or creates the 'Mockly App Data' folder in user's Google Drive.
 */
export async function getOrCreateAppFolder(token: string): Promise<string> {
  if (activeFolderId) {
    return activeFolderId;
  }

  const query = encodeURIComponent(
    `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!searchRes.ok) {
    if (searchRes.status === 401) {
      disconnectDrive();
      throw new Error('Google Drive authorization expired. Please reconnect.');
    }
    throw new Error(`Google Drive API error: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    activeFolderId = searchData.files[0].id;
    localStorage.setItem(STORAGE_KEY_FOLDER_ID, activeFolderId!);
    return activeFolderId!;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }

  const folderData = await createRes.json();
  activeFolderId = folderData.id;
  localStorage.setItem(STORAGE_KEY_FOLDER_ID, activeFolderId!);
  return activeFolderId!;
}

/**
 * Uploads or updates a file inside the Mockly folder on Google Drive
 */
async function uploadOrUpdateFile(
  token: string,
  folderId: string,
  filename: string,
  content: string | Uint8Array,
  mimeType = 'application/json'
): Promise<string> {
  const cacheKey = `${folderId}:${filename}`;
  let existingFileId = fileIdCache.get(cacheKey) || null;

  // If not cached, check if file already exists in folder
  if (!existingFileId) {
    const query = encodeURIComponent(
      `name = '${filename}' and '${folderId}' in parents and trashed = false`
    );

    const checkRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (checkRes.ok) {
      const existingData = await checkRes.json();
      if (existingData.files && existingData.files.length > 0) {
        existingFileId = existingData.files[0].id;
        fileIdCache.set(cacheKey, existingFileId!);
      }
    }
  }

  const metadata = {
    name: filename,
    mimeType,
    ...(!existingFileId ? { parents: [folderId] } : {}),
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  
  let body: BodyInit;
  let headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  if (typeof content === 'string') {
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;
      
    body = multipartRequestBody;
    headers['Content-Type'] = `multipart/related; boundary=${boundary}`;
  } else {
    // For binary data, we use simple upload (or resumable for larger, but simple is ok for now if < 5MB)
    // Actually, multipart works for binary if we encode or use a FormData, but the simplest is to just use a multipart blob if possible.
    // Let's use simple upload to just overwrite the file if existing, or create new.
    // We can use a FormData to create a multipart request easily for binary.
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));
    body = form;
    // Do not set Content-Type header when using FormData; the browser will set it with the correct boundary
  }

  const url = existingFileId
    ? (typeof content === 'string' 
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`)
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const uploadRes = await fetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers,
    body,
  });

  if (!uploadRes.ok) {
    // If PATCH failed (e.g. 404 file deleted in drive), clear cache and try POST once
    if (existingFileId && (uploadRes.status === 404 || uploadRes.status === 400)) {
      fileIdCache.delete(cacheKey);
      return uploadOrUpdateFile(token, folderId, filename, content, mimeType);
    }
    throw new Error(`Failed to upload to Google Drive: ${uploadRes.statusText}`);
  }

  const resData = await uploadRes.json();
  const fileId = resData.id;
  fileIdCache.set(cacheKey, fileId);
  return fileId;
}

/**
 * Backs up entire store to Google Drive
 */
export async function backupAllToGoogleDrive(state: { tests: Test[]; attempts: TestAttempt[]; settings?: any }): Promise<{ success: boolean; fileId: string; timestamp: number }> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);

  const now = Date.now();
  const payload: DriveBackupPayload = {
    version: 1,
    appName: 'Mockly',
    timestamp: now,
    backupDate: new Date(now).toISOString(),
    tests: state.tests || [],
    attempts: state.attempts || [],
    settings: state.settings || {},
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const fileId = await uploadOrUpdateFile(token, folderId, BACKUP_FILENAME, jsonString);

  localStorage.setItem(STORAGE_KEY_LAST_SYNC, now.toString());

  return {
    success: true,
    fileId,
    timestamp: now,
  };
}

/**
 * Restores entire store from the backup file in Google Drive
 */
export async function restoreAllFromGoogleDrive(): Promise<DriveBackupPayload> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);

  const query = encodeURIComponent(
    `name = '${BACKUP_FILENAME}' and '${folderId}' in parents and trashed = false`
  );

  const checkRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!checkRes.ok) {
    throw new Error('Failed to locate backup file on Google Drive.');
  }

  const data = await checkRes.json();
  if (!data.files || data.files.length === 0) {
    throw new Error('No Mockly backup found in your Google Drive folder.');
  }

  const fileId = data.files[0].id;

  // Download content
  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!downloadRes.ok) {
    throw new Error('Failed to download backup content from Google Drive.');
  }

  const payload: DriveBackupPayload = await downloadRes.json();
  if (!payload || (!payload.tests && !payload.attempts)) {
    throw new Error('Backup file format is invalid.');
  }

  return payload;
}

/**
 * Exports a single test paper into the user's Google Drive folder
 */
export async function exportTestToGoogleDrive(test: Test): Promise<string> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);

  const cleanTitle = (test.title || 'Untitled_Test').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `[Test] ${cleanTitle}.json`;
  const content = JSON.stringify(test, null, 2);

  const fileId = await uploadOrUpdateFile(token, folderId, filename, content);
  return fileId;
}

/**
 * Lists all backup files & exported test papers in user's Google Drive folder
 */
export async function listDriveFiles(): Promise<DriveBackupFile[]> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, mimeType, size, createdTime, modifiedTime)&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to list files from Google Drive.');
  }

  const data = await res.json();
  const files: DriveBackupFile[] = (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined,
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    isFullBackup: f.name === BACKUP_FILENAME,
  }));

  return files;
}

/**
 * Downloads a single test paper JSON from Drive by file ID
 */
export async function downloadTestFromDrive(fileId: string): Promise<Test> {
  const token = await requestDriveAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to download test paper from Google Drive.');
  }

  const test: Test = await res.json();
  if (!test || !Array.isArray(test.questions)) {
    throw new Error('Downloaded file is not a valid Mockly test paper.');
  }

  return test;
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const token = await requestDriveAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.ok;
}

/**
 * Saves live candidate test session (answers, marked status, timers, visited state) directly to Google Drive.
 */
export async function saveLiveTestSessionToDrive(
  testId: string,
  testTitle: string,
  sessionData: any
): Promise<string> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);

  const cleanTitle = (testTitle || 'Test').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `[Live Session] ${cleanTitle}_${testId}.json`;

  const payload = {
    version: 1,
    type: 'live_test_session',
    testId,
    testTitle,
    lastSyncedAt: Date.now(),
    syncIsoDate: new Date().toISOString(),
    session: sessionData,
  };

  const content = JSON.stringify(payload, null, 2);
  const fileId = await uploadOrUpdateFile(token, folderId, filename, content);
  return fileId;
}

/**
 * Retrieves live test session from Google Drive if one was previously saved
 */
export async function getLiveTestSessionFromDrive(
  testId: string,
  testTitle?: string
): Promise<any | null> {
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);

    const cleanTitle = (testTitle || '').replace(/[/\\?%*:|"<>]/g, '_');
    const filename = cleanTitle
      ? `[Live Session] ${cleanTitle}_${testId}.json`
      : undefined;

    const query = filename
      ? encodeURIComponent(`name = '${filename}' and '${folderId}' in parents and trashed = false`)
      : encodeURIComponent(`name contains '${testId}' and '${folderId}' in parents and trashed = false`);

    const checkRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, modifiedTime)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!checkRes.ok) return null;
    const data = await checkRes.json();
    if (!data.files || data.files.length === 0) return null;

    const fileId = data.files[0].id;
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!downloadRes.ok) return null;
    const fileData = await downloadRes.json();
    return fileData?.session || fileData;
  } catch (err) {
    console.warn('Could not load live test session from Google Drive:', err);
    return null;
  }
}

/**
 * Deletes live test session file from Google Drive upon submission or restart
 */
export async function deleteLiveTestSessionFromDrive(
  testId: string,
  testTitle?: string
): Promise<boolean> {
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);

    const cleanTitle = (testTitle || '').replace(/[/\\?%*:|"<>]/g, '_');
    const filename = cleanTitle
      ? `[Live Session] ${cleanTitle}_${testId}.json`
      : undefined;

    const query = filename
      ? encodeURIComponent(`name = '${filename}' and '${folderId}' in parents and trashed = false`)
      : encodeURIComponent(`name contains '${testId}' and '${folderId}' in parents and trashed = false`);

    const checkRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!checkRes.ok) return false;
    const data = await checkRes.json();
    if (!data.files || data.files.length === 0) return true;

    for (const f of data.files) {
      await deleteDriveFile(f.id);
      fileIdCache.delete(`${folderId}:${f.name}`);
    }
    return true;
  } catch (err) {
    console.warn('Failed to delete live test session from Drive:', err);
    return false;
  }
}

/**
 * Saves a completed test attempt directly to Google Drive
 */
export async function saveCompletedAttemptToDrive(
  attempt: TestAttempt,
  testTitle?: string
): Promise<string> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);

  const cleanTitle = (testTitle || 'Test_Attempt').replace(/[/\\?%*:|"<>]/g, '_');
  const dateStr = new Date(attempt.endTime || Date.now()).toISOString().replace(/[:.]/g, '-');
  const filename = `[Attempt] ${cleanTitle}_${dateStr}.json`;

  const payload = {
    version: 1,
    type: 'test_attempt',
    attemptId: attempt.id,
    testId: attempt.testId,
    testTitle: testTitle || 'Untitled Test',
    attempt,
    savedAt: Date.now(),
  };

  const content = JSON.stringify(payload, null, 2);
  const fileId = await uploadOrUpdateFile(token, folderId, filename, content);
  return fileId;
}

// In-flight sync queue controller for live actions (debounced & serial)
interface LiveQueueItem {
  testId: string;
  testTitle: string;
  sessionData: any;
  callback?: (status: 'saving' | 'synced' | 'error', errorMsg?: string) => void;
}

let pendingLiveQueue: LiveQueueItem | null = null;
let isLiveSyncInFlight = false;
let liveDebounceTimer: any = null;

export function queueLiveSessionDriveSync(
  testId: string,
  testTitle: string,
  sessionData: any,
  callback?: (status: 'saving' | 'synced' | 'error', errorMsg?: string) => void
) {
  if (!isDriveConnected()) return;

  pendingLiveQueue = { testId, testTitle, sessionData, callback };
  callback?.('saving');

  if (liveDebounceTimer) {
    clearTimeout(liveDebounceTimer);
  }

  liveDebounceTimer = setTimeout(async () => {
    if (isLiveSyncInFlight || !pendingLiveQueue) return;

    const itemToProcess = pendingLiveQueue;
    pendingLiveQueue = null;
    isLiveSyncInFlight = true;

    try {
      await saveLiveTestSessionToDrive(
        itemToProcess.testId,
        itemToProcess.testTitle,
        itemToProcess.sessionData
      );
      itemToProcess.callback?.('synced');
    } catch (err: any) {
      console.warn('Live session Drive sync error:', err);
      itemToProcess.callback?.('error', err.message);
    } finally {
      isLiveSyncInFlight = false;
      // If a newer item was queued while this one was uploading, process it immediately
      if (pendingLiveQueue) {
        queueLiveSessionDriveSync(
          pendingLiveQueue.testId,
          pendingLiveQueue.testTitle,
          pendingLiveQueue.sessionData,
          pendingLiveQueue.callback
        );
      }
    }
  }, 400); // 400ms debounce ensures immediate response without excessive round-trips
}

/**
 * Saves the local SQLite database to Google Drive
 */
export async function saveDatabaseToDrive(dbBytes: Uint8Array): Promise<string> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);
  const filename = 'mockly_database.sqlite';

  const fileId = await uploadOrUpdateFile(
    token, 
    folderId, 
    filename, 
    dbBytes, 
    'application/x-sqlite3'
  );
  
  localStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
  return fileId;
}

/**
 * Loads the local SQLite database from Google Drive
 */
export async function loadDatabaseFromDrive(): Promise<Uint8Array | null> {
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);
    const filename = 'mockly_database.sqlite';

    const query = encodeURIComponent(`name = '${filename}' and '${folderId}' in parents and trashed = false`);
    const checkRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, modifiedTime)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!checkRes.ok) return null;
    const data = await checkRes.json();
    if (!data.files || data.files.length === 0) return null;

    const fileId = data.files[0].id;
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!downloadRes.ok) return null;
    const arrayBuffer = await downloadRes.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.warn('Could not load database from Google Drive:', err);
    return null;
  }
}

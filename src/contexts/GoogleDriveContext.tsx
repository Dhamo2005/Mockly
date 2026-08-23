import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  isDriveConnected,
  requestDriveAccessToken,
  disconnectDrive,
  backupAllToGoogleDrive,
  restoreAllFromGoogleDrive,
  refreshFromGoogleDrive,
  listDriveFiles,
  exportTestToGoogleDrive,
  saveTestToGoogleDrive,
  deleteTestFromGoogleDrive,
  deleteAttemptFromGoogleDrive,
  downloadTestFromDrive,
  deleteDriveFile,
  getDriveAutoSync,
  setDriveAutoSync as setStoredAutoSync,
  getDriveLastSync,
  saveLiveTestSessionToDrive,
  getLiveTestSessionFromDrive,
  deleteLiveTestSessionFromDrive,
  saveCompletedAttemptToDrive,
  queueLiveSessionDriveSync,
  DriveBackupFile,
} from '../lib/googleDriveSync';
import { useStore } from '../store/useStore';
import { Test, TestAttempt } from '../types';

export type LiveDriveSyncStatus = 'idle' | 'saving' | 'synced' | 'error';

interface GoogleDriveContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  autoSync: boolean;
  lastSyncTime: number | null;
  files: DriveBackupFile[];
  statusMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
  liveSyncStatus: LiveDriveSyncStatus;
  liveSyncLastSaved: number | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  backupToDrive: () => Promise<boolean>;
  restoreFromDrive: () => Promise<boolean>;
  refreshFromDrive: () => Promise<boolean>;
  toggleAutoSync: (enabled?: boolean) => void;
  exportTest: (test: Test) => Promise<boolean>;
  saveTest: (test: Test) => Promise<boolean>;
  deleteTest: (testId: string) => Promise<boolean>;
  importTest: (fileId: string) => Promise<Test | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  deleteAttempt: (attemptId: string) => Promise<boolean>;
  refreshFiles: () => Promise<void>;
  syncLiveSession: (testId: string, testTitle: string, sessionData: any) => void;
  loadLiveSession: (testId: string, testTitle?: string) => Promise<any | null>;
  deleteLiveSession: (testId: string, testTitle?: string) => Promise<boolean>;
  saveCompletedAttempt: (attempt: TestAttempt, testTitle?: string) => Promise<string | null>;
  clearStatus: () => void;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | null>(null);

export function GoogleDriveProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(isDriveConnected());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(getDriveAutoSync());
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(getDriveLastSync());
  const [files, setFiles] = useState<DriveBackupFile[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [liveSyncStatus, setLiveSyncStatus] = useState<LiveDriveSyncStatus>('idle');
  const [liveSyncLastSaved, setLiveSyncLastSaved] = useState<number | null>(null);

  const importTests = useStore((state) => state.importTests);
  const addAttempt = useStore((state) => state.addAttempt);
  const deleteStoreTest = useStore((state) => state.deleteTest);
  const deleteStoreAttempt = useStore((state) => state.deleteAttempt);

  const setTimedStatus = (type: 'success' | 'error' | 'info', text: string, duration = 4000) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, duration);
  };

  const clearStatus = () => setStatusMessage(null);

  const refreshFiles = useCallback(async () => {
    if (!isDriveConnected()) return;
    setIsSyncing(true);
    try {
      const fileList = await listDriveFiles();
      setFiles(fileList);
    } catch (e: any) {
      console.warn('Failed to fetch Google Drive files list:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Connect flow
  const connect = async (): Promise<boolean> => {
    setIsConnecting(true);
    clearStatus();
    try {
      await requestDriveAccessToken(true);
      setIsConnected(true);
      setTimedStatus('success', 'Google Drive connected! App data folder ready.');
      await refreshFiles();
      await refreshFromDrive();
      return true;
    } catch (err: any) {
      console.error('Failed to connect Google Drive:', err);
      setTimedStatus('error', err.message || 'Google Drive authentication cancelled or failed.');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    disconnectDrive();
    setIsConnected(false);
    setFiles([]);
    setLiveSyncStatus('idle');
    setTimedStatus('info', 'Google Drive disconnected.');
  };

  const toggleAutoSync = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !autoSync;
    setAutoSync(nextVal);
    setStoredAutoSync(nextVal);
    setTimedStatus('info', nextVal ? 'Google Drive auto-sync enabled.' : 'Google Drive auto-sync disabled.');
  };

  const backupToDrive = async (): Promise<boolean> => {
    if (!isDriveConnected()) return false;
    setIsSyncing(true);
    try {
      const state = useStore.getState();
      const res = await backupAllToGoogleDrive({
        tests: state.tests,
        attempts: state.attempts,
      });
      setLastSyncTime(res.timestamp);
      setTimedStatus('success', `Saved ${state.tests.length} tests and ${state.attempts.length} attempts to Google Drive!`);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Backup to Drive failed:', err);
      if (err.message?.includes('expired') || err.message?.includes('authorization')) {
        setIsConnected(false);
      }
      setTimedStatus('error', err.message || 'Failed to save to Google Drive.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const restoreFromDrive = async (): Promise<boolean> => {
    if (!isDriveConnected()) return false;
    setIsSyncing(true);
    try {
      const payload = await restoreAllFromGoogleDrive();
      if (payload.tests && payload.tests.length > 0) {
        importTests(payload.tests);
      }
      if (payload.attempts && payload.attempts.length > 0) {
        payload.attempts.forEach((att) => addAttempt(att));
      }
      const now = Date.now();
      setLastSyncTime(now);
      setTimedStatus('success', `Restored ${payload.tests?.length || 0} tests & ${payload.attempts?.length || 0} attempts from Google Drive!`);
      await refreshFiles();
      return true;
    } catch (err: any) {
      console.error('Restore from Drive failed:', err);
      setTimedStatus('error', err.message || 'Failed to restore data from Google Drive.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshFromDrive = async (): Promise<boolean> => {
    if (!isDriveConnected()) return false;
    setIsSyncing(true);
    try {
      const { tests: loadedTests, attempts: loadedAttempts } = await refreshFromGoogleDrive();
      const now = Date.now();
      setLastSyncTime(now);
      await refreshFiles();
      setTimedStatus('success', `Refreshed from Google Drive: ${loadedTests.length} test(s) loaded.`);
      return true;
    } catch (err: any) {
      console.warn('Refresh from Drive error:', err);
      setTimedStatus('error', err.message || 'Failed to refresh from Google Drive.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const saveTest = async (test: Test): Promise<boolean> => {
    if (!isDriveConnected()) return false;
    try {
      await saveTestToGoogleDrive(test);
      await refreshFiles();
      setTimedStatus('success', `Saved "${test.title}" to Google Drive.`);
      return true;
    } catch (err: any) {
      console.warn('Failed to save test to Drive:', err);
      setTimedStatus('error', err.message || 'Failed to save test to Google Drive.');
      return false;
    }
  };

  const deleteTest = async (testId: string): Promise<boolean> => {
    deleteStoreTest(testId);
    if (!isDriveConnected()) return true;
    try {
      await deleteTestFromGoogleDrive(testId);
      await refreshFiles();
      setTimedStatus('info', 'Test removed from Google Drive.');
      return true;
    } catch (err: any) {
      console.warn('Failed to delete test from Drive:', err);
      return false;
    }
  };

  const deleteAttempt = async (attemptId: string): Promise<boolean> => {
    deleteStoreAttempt(attemptId);
    if (!isDriveConnected()) return true;
    try {
      await deleteAttemptFromGoogleDrive(attemptId);
      await refreshFiles();
      setTimedStatus('info', 'Attempt removed from Google Drive.');
      return true;
    } catch (err: any) {
      console.warn('Failed to delete attempt from Drive:', err);
      return false;
    }
  };

  const exportTest = async (test: Test): Promise<boolean> => {
    setIsSyncing(true);
    try {
      await exportTestToGoogleDrive(test);
      setTimedStatus('success', `"${test.title}" exported to Google Drive folder.`);
      await refreshFiles();
      return true;
    } catch (err: any) {
      setTimedStatus('error', err.message || 'Failed to export test to Google Drive.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const importTest = async (fileId: string): Promise<Test | null> => {
    setIsSyncing(true);
    try {
      const test = await downloadTestFromDrive(fileId);
      importTests([test]);
      setTimedStatus('success', `Imported "${test.title}" (${test.questions.length} Qs) into Question Bank!`);
      return test;
    } catch (err: any) {
      setTimedStatus('error', err.message || 'Failed to download test from Google Drive.');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      const ok = await deleteDriveFile(fileId);
      if (ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        setTimedStatus('info', 'File removed from Google Drive folder.');
        return true;
      }
      return false;
    } catch (err: any) {
      setTimedStatus('error', err.message || 'Failed to delete file from Google Drive.');
      return false;
    }
  };

  /**
   * Live Test Attendance Seamless Drive Syncing
   */
  const syncLiveSession = useCallback(
    (testId: string, testTitle: string, sessionData: any) => {
      if (!isDriveConnected()) return;

      queueLiveSessionDriveSync(
        testId,
        testTitle,
        sessionData,
        (status, errMsg) => {
          if (status === 'saving') {
            setLiveSyncStatus('saving');
          } else if (status === 'synced') {
            setLiveSyncStatus('synced');
            setLiveSyncLastSaved(Date.now());
          } else if (status === 'error') {
            setLiveSyncStatus('error');
            console.warn('Google Drive live sync issue:', errMsg);
          }
        }
      );
    },
    []
  );

  const loadLiveSession = useCallback(
    async (testId: string, testTitle?: string): Promise<any | null> => {
      if (!isDriveConnected()) return null;
      try {
        return await getLiveTestSessionFromDrive(testId, testTitle);
      } catch (e) {
        console.warn('Failed to load live test session from Drive:', e);
        return null;
      }
    },
    []
  );

  const deleteLiveSession = useCallback(
    async (testId: string, testTitle?: string): Promise<boolean> => {
      if (!isDriveConnected()) return false;
      try {
        return await deleteLiveTestSessionFromDrive(testId, testTitle);
      } catch (e) {
        return false;
      }
    },
    []
  );

  const saveCompletedAttempt = useCallback(
    async (attempt: TestAttempt, testTitle?: string): Promise<string | null> => {
      if (!isDriveConnected()) return null;
      try {
        const fileId = await saveCompletedAttemptToDrive(attempt, testTitle);
        // Also update master backup in Drive in background
        const state = useStore.getState();
        backupAllToGoogleDrive({
          tests: state.tests,
          attempts: [...state.attempts, attempt],
        }).catch(() => {});
        refreshFiles();
        return fileId;
      } catch (e) {
        console.warn('Failed to save attempt to Drive:', e);
        return null;
      }
    },
    [refreshFiles]
  );

  // Auto-refresh from Google Drive on startup / page refresh if token exists
  useEffect(() => {
    if (isDriveConnected()) {
      setIsConnected(true);
      refreshFiles();
      refreshFromDrive();
    }
  }, []);

  // Auto-sync debounced trigger when store state changes if autoSync is true
  const lastSyncRef = useRef<number>(Date.now());
  useEffect(() => {
    if (!isConnected || !autoSync) return;

    let timeoutId: any;
    const unsub = useStore.subscribe((state) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastSyncRef.current = Date.now();
        backupAllToGoogleDrive({
          tests: state.tests,
          attempts: state.attempts,
        })
          .then((res) => {
            setLastSyncTime(res.timestamp);
            refreshFiles();
          })
          .catch((err) => console.warn('Auto-sync to Google Drive error:', err));
      }, 1500); // Fast 1.5s auto-save to Google Drive
    });

    return () => {
      clearTimeout(timeoutId);
      unsub();
    };
  }, [isConnected, autoSync, refreshFiles]);

  return (
    <GoogleDriveContext.Provider
      value={{
        isConnected,
        isConnecting,
        isSyncing,
        autoSync,
        lastSyncTime,
        files,
        statusMessage,
        liveSyncStatus,
        liveSyncLastSaved,
        connect,
        disconnect,
        backupToDrive,
        restoreFromDrive,
        refreshFromDrive,
        toggleAutoSync,
        exportTest,
        saveTest,
        deleteTest,
        importTest,
        deleteFile,
        deleteAttempt,
        refreshFiles,
        syncLiveSession,
        loadLiveSession,
        deleteLiveSession,
        saveCompletedAttempt,
        clearStatus,
      }}
    >
      {children}
    </GoogleDriveContext.Provider>
  );
}

export function useGoogleDrive() {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
}

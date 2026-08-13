import { useEffect, useRef } from 'react';
import { useAuth, getAccessToken } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { initLocalSQLiteDatabase, resetLocalSQLiteDatabase, loadSQLiteFromDrive, saveSQLiteToDrive } from '../lib/sqliteDriveSync';

export function DriveSync() {
  const { user } = useAuth();
  const loadedOnce = useRef(false);

  // Initialize local SQLite engine and load database immediately on mount
  useEffect(() => {
    initLocalSQLiteDatabase();
  }, []);

  // Sync database on mount and whenever user changes
  useEffect(() => {
    let active = true;
    
    async function syncData() {
      const token = getAccessToken();
      await loadSQLiteFromDrive(token);
      if (active) loadedOnce.current = true;
    }
    
    syncData();
    
    return () => {
      active = false;
    };
  }, [user]);

  // Save to SQLite database (and Drive if token exists) when store changes
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!loadedOnce.current) return;
      const token = getAccessToken();
      saveSQLiteToDrive(token, state, false);
    });
    return unsub;
  }, []);

  // Periodic and visibility based sync
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!loadedOnce.current) return;
      const token = getAccessToken();
      saveSQLiteToDrive(token, useStore.getState(), false);
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && loadedOnce.current) {
        const token = getAccessToken();
        saveSQLiteToDrive(token, useStore.getState(), true);
      }
    };
    
    const handleOnline = () => {
      if (loadedOnce.current) {
        const token = getAccessToken();
        saveSQLiteToDrive(token, useStore.getState(), false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  return null;
}


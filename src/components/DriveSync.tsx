import { useEffect, useRef } from 'react';
import { useAuth, getAccessToken } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { loadFromDrive, saveToDrive } from '../lib/driveSync';

export function DriveSync() {
  const { user } = useAuth();
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!user) {
      loadedOnce.current = false;
    }
  }, [user]);

  // Load from drive when user logs in
  useEffect(() => {
    let active = true;
    
    async function init() {
      const token = getAccessToken();
      if (token && !loadedOnce.current) {
        await loadFromDrive(token);
        if (active) loadedOnce.current = true;
      }
    }
    
    init();
    
    return () => {
      active = false;
    };
  }, [user]);

  // Save to drive when store changes
  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      // Don't save if we haven't finished the initial load yet (if logged in)
      if (user && !loadedOnce.current) return;
      
      const token = getAccessToken();
      if (token) {
        saveToDrive(token, state);
      }
    });
    return unsub;
  }, [user]);

  return null;
}

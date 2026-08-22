import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { loadFromFirestore, saveToFirestore, subscribeToFirestore } from '../lib/firebaseSync';
import { isDriveConnected } from '../lib/googleDriveSync';

export function FirebaseSync() {
  const { user, loading } = useAuth();
  const setIsInitialized = useStore((state) => state.setIsInitialized);
  const loadedOnce = useRef(false);

  // Sync and subscribe to database whenever user changes
  useEffect(() => {
    if (loading) return; // Wait until Auth resolves

    if (user) {
      // Real-time multi-device listener
      const unsub = subscribeToFirestore(user.uid, () => {
        loadedOnce.current = true;
        setIsInitialized(true);
      });

      // Safety timeout in case client is offline or network is slow
      const timer = setTimeout(() => {
        if (!loadedOnce.current) {
          loadedOnce.current = true;
          setIsInitialized(true);
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
        unsub();
      };
    } else {
      // If not logged in, local state is initialized
      loadedOnce.current = true;
      setIsInitialized(true);
    }
  }, [user, loading, setIsInitialized]);

  // Save to Firestore when store changes (only if Google Drive is not connected or as occasional fallback)
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!loadedOnce.current || !user || loading) return;
      // If user prioritized Google Drive, avoid frequent Firestore calls on every micro-mutation
      if (isDriveConnected()) return;
      saveToFirestore(user.uid, state);
    });
    return unsub;
  }, [user, loading]);

  // Periodic and visibility based sync (only when Drive is not the active primary)
  useEffect(() => {
    if (!user || loading) return;

    const interval = setInterval(() => {
      if (!loadedOnce.current) return;
      if (isDriveConnected()) return; // Google Drive is primary storage
      saveToFirestore(user.uid, useStore.getState());
    }, 30000);

    const handleVisibilityChange = () => {
      if (isDriveConnected()) return;
      if (document.visibilityState === 'visible' && loadedOnce.current) {
        loadFromFirestore(user.uid);
      } else if (document.visibilityState === 'hidden' && loadedOnce.current) {
        saveToFirestore(user.uid, useStore.getState(), true);
      }
    };
    
    const handleOnline = () => {
      if (loadedOnce.current && !isDriveConnected()) {
        loadFromFirestore(user.uid);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, loading]);

  return null;
}



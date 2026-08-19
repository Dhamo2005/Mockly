import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { loadFromFirestore, saveToFirestore } from '../lib/firebaseSync';

export function FirebaseSync() {
  const { user } = useAuth();
  const setIsInitialized = useStore((state) => state.setIsInitialized);
  const loadedOnce = useRef(false);

  // Sync database whenever user changes
  useEffect(() => {
    let active = true;
    
    async function syncData() {
      if (user) {
        await loadFromFirestore(user.uid);
      } else {
        // If not logged in, we are initialized as an empty state
        useStore.setState({
          tests: [],
          attempts: [],
          activeTestSessions: {},
          bookmarks: {}
        });
      }
      
      if (active) {
        loadedOnce.current = true;
        setIsInitialized(true);
      }
    }
    
    syncData();
    
    return () => {
      active = false;
    };
  }, [user, setIsInitialized]);

  // Save to Firestore when store changes
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!loadedOnce.current || !user) return;
      saveToFirestore(user.uid, state);
    });
    return unsub;
  }, [user]);

  // Periodic and visibility based sync
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!loadedOnce.current) return;
      saveToFirestore(user.uid, useStore.getState());
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && loadedOnce.current) {
        saveToFirestore(user.uid, useStore.getState());
      }
    };
    
    const handleOnline = () => {
      if (loadedOnce.current) {
        saveToFirestore(user.uid, useStore.getState());
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


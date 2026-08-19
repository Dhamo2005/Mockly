import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { Test, TestAttempt, ActiveTestSession, Language } from '../types';

let syncTimeout: any;

export async function saveToFirestore(userId: string, state: any) {
  if (!db || !userId) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    try {
      useStore.getState().setSyncStatus('saving');
      
      const batch = writeBatch(db);

      // Save user data (bookmarks & language)
      if (userId) {
        const bookmarks = Object.keys(state.bookmarks || {}).filter(k => state.bookmarks[k]);
        batch.set(doc(db, 'users', userId), {
          bookmarks,
          language: state.language || 'en'
        }, { merge: true });
      }

      // Save tests
      if (state.tests) {
        for (const test of state.tests) {
          if (test.id) {
            batch.set(doc(db, 'tests', test.id), { ...test, ownerId: test.ownerId || userId }, { merge: true });
          }
        }
      }

      // Save attempts
      if (state.attempts && userId) {
        for (const attempt of state.attempts) {
          if (attempt.id) {
            batch.set(doc(db, 'users', userId, 'attempts', attempt.id), { ...attempt, userId }, { merge: true });
          }
        }
      }

      // Save active sessions
      if (state.activeTestSessions && userId) {
        for (const testId of Object.keys(state.activeTestSessions)) {
          if (testId) {
            const session = state.activeTestSessions[testId];
            batch.set(doc(db, 'users', userId, 'activeSessions', testId), { ...session, userId }, { merge: true });
          }
        }
      }

      await batch.commit();
      useStore.getState().setSyncStatus('synced', Date.now());
    } catch (e) {
      console.error('Failed to save to Firestore', e);
      useStore.getState().setSyncStatus('error');
    }
  }, 2000);
}

export async function loadFromFirestore(userId: string) {
  if (!db || !userId) return;
  try {
    useStore.getState().setSyncStatus('saving');

    // Load user data
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userData = userSnap.data() || {};
    const bookmarks: Record<string, boolean> = {};
    if (Array.isArray(userData.bookmarks)) {
      userData.bookmarks.forEach((b: string) => {
        if (b) bookmarks[b] = true;
      });
    }
    const language: Language = userData.language || 'en';

    // Load tests
    const testsSnap = await getDocs(collection(db, 'tests'));
    const tests = testsSnap.docs.map(d => d.data() as Test);
    
    // Load attempts
    const attemptsSnap = await getDocs(collection(db, 'users', userId, 'attempts'));
    const attempts = attemptsSnap.docs.map(d => d.data() as TestAttempt);
    
    // Load active sessions
    const sessionsSnap = await getDocs(collection(db, 'users', userId, 'activeSessions'));
    const activeTestSessions: Record<string, ActiveTestSession> = {};
    sessionsSnap.docs.forEach(d => {
      activeTestSessions[d.id] = d.data() as ActiveTestSession;
    });

    useStore.setState({
      tests,
      attempts,
      activeTestSessions,
      bookmarks,
      language
    });
    
    useStore.getState().setSyncStatus('synced', Date.now());
  } catch (e: any) {
    if (e.message && e.message.includes('the client is offline')) {
       console.error('Failed to load from Firestore (client is offline). This usually means the domain is not authorized in Firebase or network is down.', e);
    } else {
       console.error('Failed to load from Firestore', e);
    }
    useStore.getState().setSyncStatus('error');
  }
}

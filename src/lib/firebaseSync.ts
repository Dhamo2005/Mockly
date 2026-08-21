import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { Test, TestAttempt, ActiveTestSession, Language } from '../types';

let syncTimeout: any = null;

// Sanitize string to make safe Firestore document IDs
export const sanitizeTestId = (rawId?: string): string => {
  if (!rawId || typeof rawId !== 'string') {
    return 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
  const clean = rawId.trim().replace(/[\/\s#?\[\]*]+/g, '_').replace(/[^a-zA-Z0-9_\-\.:]/g, '');
  return clean.length > 0 ? clean.substring(0, 128) : 'test_' + Date.now();
};

// Helper to remove undefined values and invalid properties which crash Firestore SDK
export const cleanData = (obj: any) => {
  if (obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj));
};

export async function deleteActiveSessionFromFirestore(userId: string, testId: string) {
  if (!db || !userId || !testId) return;
  try {
    const cleanId = sanitizeTestId(testId);
    await deleteDoc(doc(db, 'users', userId, 'activeSessions', cleanId));
  } catch (e) {
    console.warn('Failed to delete active session document from Firestore', e);
  }
}

export async function deleteTestFromFirestore(testId: string) {
  if (!db || !testId) return;
  try {
    const cleanId = sanitizeTestId(testId);
    await deleteDoc(doc(db, 'tests', cleanId));
  } catch (e) {
    console.warn('Failed to delete test document from Firestore', e);
  }
}

export async function fetchTestByIdFromFirestore(testId: string): Promise<Test | null> {
  if (!db || !testId) return null;
  try {
    const cleanId = sanitizeTestId(testId);
    const snap = await getDoc(doc(db, 'tests', cleanId));
    if (snap.exists()) {
      const data = snap.data() as Test;
      return { ...data, id: snap.id };
    }
  } catch (e) {
    console.warn(`Failed to fetch test ${testId} from Firestore:`, e);
  }
  return null;
}

export async function updateTestSharingInFirestore(
  userId: string | null | undefined,
  testId: string,
  visibility: 'public' | 'private',
  isPublic: boolean,
  ownerInfo?: { ownerName?: string; ownerEmail?: string }
): Promise<boolean> {
  if (!testId) return false;
  const cleanId = sanitizeTestId(testId);
  const targetId = testId;

  // 1. Immediately update in local state for all tests matching ID
  const store = useStore.getState();
  const existingTest = store.tests.find(t => t.id === cleanId || t.id === targetId || sanitizeTestId(t.id) === cleanId);

  const testPayload = {
    visibility,
    isPublic,
    ...(ownerInfo?.ownerName ? { ownerName: ownerInfo.ownerName } : {}),
    ...(ownerInfo?.ownerEmail ? { ownerEmail: ownerInfo.ownerEmail } : {})
  };

  store.updateTest({
    id: cleanId,
    ...testPayload
  } as any);

  if (targetId !== cleanId) {
    store.updateTest({
      id: targetId,
      ...testPayload
    } as any);
  }

  if (existingTest) {
    store.updateTest({
      id: existingTest.id,
      ...testPayload
    } as any);
  }

  // 2. Also save to Firestore if db is ready
  if (db) {
    try {
      const updates: any = {
        id: cleanId,
        title: existingTest?.title || 'Untitled Test',
        timeLimit: existingTest?.timeLimit || 3600,
        visibility,
        isPublic,
        ...(userId ? { ownerId: userId } : existingTest?.ownerId ? { ownerId: existingTest.ownerId } : {}),
        ...(ownerInfo?.ownerName ? { ownerName: ownerInfo.ownerName } : {}),
        ...(ownerInfo?.ownerEmail ? { ownerEmail: ownerInfo.ownerEmail } : {})
      };
      
      // If we have questions in existingTest, preserve them too
      if (existingTest?.questions) {
        updates.questions = existingTest.questions;
      }
      if (existingTest?.sections) {
        updates.sections = existingTest.sections;
      }
      if (existingTest?.settings) {
        updates.settings = existingTest.settings;
      }
      if (existingTest?.description) {
        updates.description = existingTest.description;
      }

      await setDoc(doc(db, 'tests', cleanId), cleanData(updates), { merge: true });
      return true;
    } catch (e) {
      console.warn('Failed to update test sharing in Firestore (local updated):', e);
      return false;
    }
  }
  return true;
}

export async function saveTestToFirestore(userId: string, test: Test): Promise<boolean> {
  if (!db || !userId || !test) return false;
  try {
    const cleanId = sanitizeTestId(test.id);
    const testToSave = {
      ...test,
      id: cleanId,
      ownerId: (test as any).ownerId || userId,
      title: test.title || 'Untitled Test',
      timeLimit: test.timeLimit || 3600,
      visibility: test.visibility || 'public',
      isPublic: test.isPublic !== undefined ? test.isPublic : (test.visibility !== 'private')
    };
    
    await setDoc(doc(db, 'tests', cleanId), cleanData(testToSave), { merge: true });
    return true;
  } catch (e) {
    console.error(`Failed to save test ${test.id} to Firestore:`, e);
    return false;
  }
}

export async function saveToFirestore(userId: string, state?: any, immediate: boolean = false) {
  if (!db || !userId) return;
  
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  
  const executeSave = async () => {
    try {
      useStore.getState().setSyncStatus('saving');
      const currentState = state || useStore.getState();

      // 1. Save tests directly in parallel to ensure reliability
      if (currentState.tests && currentState.tests.length > 0) {
        const testPromises = currentState.tests.map((test: Test) => {
          if (test && test.id) {
            const cleanId = sanitizeTestId(test.id);
            const dataToSave = cleanData({
              ...test,
              id: cleanId,
              ownerId: (test as any).ownerId || userId,
              title: test.title || 'Untitled Test',
              timeLimit: test.timeLimit || 3600
            });
            return setDoc(doc(db, 'tests', cleanId), dataToSave, { merge: true });
          }
          return Promise.resolve();
        });
        await Promise.allSettled(testPromises);
      }

      // 2. Batch write user preferences, attempts, and active sessions
      const batch = writeBatch(db);

      // Save user profile data
      const bookmarks = Object.keys(currentState.bookmarks || {}).filter(k => currentState.bookmarks[k]);
      batch.set(doc(db, 'users', userId), cleanData({
        bookmarks,
        language: currentState.language || 'en'
      }), { merge: true });

      // Save attempts
      if (currentState.attempts && currentState.attempts.length > 0) {
        for (const attempt of currentState.attempts) {
          if (attempt && attempt.id) {
            const cleanAttemptId = sanitizeTestId(attempt.id);
            batch.set(doc(db, 'users', userId, 'attempts', cleanAttemptId), cleanData({ 
              ...attempt, 
              id: cleanAttemptId,
              userId 
            }), { merge: true });
          }
        }
      }

      // Save active sessions
      if (currentState.activeTestSessions) {
        const sessionKeys = Object.keys(currentState.activeTestSessions);
        for (const testId of sessionKeys) {
          if (testId) {
            const session = currentState.activeTestSessions[testId];
            if (session) {
              const cleanSessionId = sanitizeTestId(testId);
              batch.set(doc(db, 'users', userId, 'activeSessions', cleanSessionId), cleanData({ 
                ...session, 
                testId: cleanSessionId, 
                userId,
                lastUpdated: session.lastUpdated || Date.now() 
              }), { merge: true });
            }
          }
        }
      }

      await batch.commit();
      useStore.getState().setSyncStatus('synced', Date.now());
    } catch (e) {
      console.error('Failed to save to Firestore', e);
      useStore.getState().setSyncStatus('error');
    }
  };

  if (immediate) {
    await executeSave();
  } else {
    syncTimeout = setTimeout(executeSave, 500);
  }
}

export function subscribeToFirestore(userId: string, onInitialLoaded?: () => void): () => void {
  if (!db || !userId) return () => {};

  const unsubs: Unsubscribe[] = [];
  let isInitialLoad = true;

  try {
    // 1. Real-time Tests Listener
    const unsubTests = onSnapshot(collection(db, 'tests'), (snap) => {
      const remoteTests: Test[] = [];
      snap.docs.forEach((d) => {
        const data = d.data() as Test;
        if (data && data.id) {
          remoteTests.push({ ...data, id: d.id });
        }
      });

      // Update tests in store without wiping local papers
      useStore.setState((state) => {
        const map = new Map<string, Test>();
        (state.tests || []).forEach(t => {
          if (t && t.id) map.set(t.id, t);
        });
        remoteTests.forEach(t => {
          if (t && t.id) {
            const existing = map.get(t.id);
            map.set(t.id, existing ? { ...existing, ...t } : t);
          }
        });
        return { tests: Array.from(map.values()) };
      });

      if (isInitialLoad) {
        isInitialLoad = false;
        if (onInitialLoaded) onInitialLoaded();
      }
      useStore.getState().setSyncStatus('synced', Date.now());
    }, (err) => {
      console.warn('Real-time tests listener error:', err);
    });
    unsubs.push(unsubTests);

    // 2. Real-time Attempts Listener
    const unsubAttempts = onSnapshot(collection(db, 'users', userId, 'attempts'), (snap) => {
      const remoteAttempts: TestAttempt[] = [];
      snap.docs.forEach((d) => {
        const data = d.data() as TestAttempt;
        if (data && data.id) {
          remoteAttempts.push(data);
        }
      });
      useStore.setState((state) => {
        const map = new Map<string, TestAttempt>();
        (state.attempts || []).forEach(a => {
          if (a && a.id) map.set(a.id, a);
        });
        remoteAttempts.forEach(a => {
          if (a && a.id) map.set(a.id, a);
        });
        return { attempts: Array.from(map.values()) };
      });
    }, (err) => {
      console.warn('Real-time attempts listener error:', err);
    });
    unsubs.push(unsubAttempts);

    // 3. Real-time Active Sessions Listener
    const unsubSessions = onSnapshot(collection(db, 'users', userId, 'activeSessions'), (snap) => {
      const remoteSessions: Record<string, ActiveTestSession> = {};
      snap.docs.forEach((d) => {
        remoteSessions[d.id] = d.data() as ActiveTestSession;
      });
      useStore.setState((state) => ({
        activeTestSessions: {
          ...state.activeTestSessions,
          ...remoteSessions
        }
      }));
    }, (err) => {
      console.warn('Real-time sessions listener error:', err);
    });
    unsubs.push(unsubSessions);

    // 4. Real-time User Preferences Listener
    const unsubUser = onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() || {};
        const bookmarks: Record<string, boolean> = {};
        if (Array.isArray(data.bookmarks)) {
          data.bookmarks.forEach((b: string) => {
            if (b) bookmarks[b] = true;
          });
        }
        const language: Language = data.language || 'en';
        useStore.setState((state) => ({
          bookmarks: { ...state.bookmarks, ...bookmarks },
          language: language || state.language || 'en'
        }));
      }
    }, (err) => {
      console.warn('Real-time user listener error:', err);
    });
    unsubs.push(unsubUser);

  } catch (e) {
    console.error('Failed to setup Firestore real-time subscriptions:', e);
  }

  return () => {
    unsubs.forEach(unsub => {
      try {
        unsub();
      } catch (e) {}
    });
  };
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
    const tests = testsSnap.docs.map(d => ({ ...(d.data() as Test), id: d.id }));
    
    // Load attempts
    const attemptsSnap = await getDocs(collection(db, 'users', userId, 'attempts'));
    const attempts = attemptsSnap.docs.map(d => d.data() as TestAttempt);
    
    // Load active sessions
    const sessionsSnap = await getDocs(collection(db, 'users', userId, 'activeSessions'));
    const activeTestSessions: Record<string, ActiveTestSession> = {};
    sessionsSnap.docs.forEach(d => {
      activeTestSessions[d.id] = d.data() as ActiveTestSession;
    });

    useStore.setState((state) => {
      const testMap = new Map<string, Test>();
      (state.tests || []).forEach(t => { if (t?.id) testMap.set(t.id, t); });
      tests.forEach(t => { if (t?.id) testMap.set(t.id, { ...(testMap.get(t.id) || {}), ...t }); });

      const attemptMap = new Map<string, TestAttempt>();
      (state.attempts || []).forEach(a => { if (a?.id) attemptMap.set(a.id, a); });
      attempts.forEach(a => { if (a?.id) attemptMap.set(a.id, a); });

      return {
        tests: Array.from(testMap.values()),
        attempts: Array.from(attemptMap.values()),
        activeTestSessions: { ...state.activeTestSessions, ...activeTestSessions },
        bookmarks: { ...state.bookmarks, ...bookmarks },
        language: language || state.language || 'en'
      };
    });
    
    useStore.getState().setSyncStatus('synced', Date.now());
  } catch (e: any) {
    if (e.message && e.message.includes('the client is offline')) {
       console.warn('Firestore load notice: working with local/cached state while offline.');
    } else {
       console.warn('Firestore load notice:', e?.message || e);
    }
    useStore.getState().setSyncStatus('synced');
  }
}


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Test, TestAttempt, Language, ActiveTestSession } from '../types';
import { initialTests } from '../data/initialData';

export type SyncStatus = 'idle' | 'saving' | 'synced' | 'offline' | 'error';

interface AppState {
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;

  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  setSyncStatus: (status: SyncStatus, lastSyncedAt?: number) => void;

  language: Language;
  setLanguage: (lang: Language) => void;

  tests: Test[];
  addTest: (test: Test) => void;
  updateTest: (test: Test) => void;
  deleteTest: (id: string) => void;
  importTests: (tests: Test[]) => void;

  attempts: TestAttempt[];
  addAttempt: (attempt: TestAttempt) => void;
  updateAttempt: (attempt: TestAttempt) => void;
  deleteAttempt: (id: string) => void;

  activeTestSessions: Record<string, ActiveTestSession>;
  updateActiveTestSession: (testId: string, sessionData: Partial<ActiveTestSession>) => void;
  clearActiveTestSession: (testId: string) => void;

  bookmarks: Record<string, boolean>;
  toggleBookmark: (questionId: string) => void;

  clearAttempts: () => void;
  clearTests: () => void;
  clearAllData: () => void;
}

const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {}
  }
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isInitialized: false,
      setIsInitialized: (val) => set({ isInitialized: val }),

      syncStatus: 'idle',
      lastSyncedAt: null,
      setSyncStatus: (status, lastSyncedAt) => set((state) => ({
        syncStatus: status,
        lastSyncedAt: lastSyncedAt !== undefined ? lastSyncedAt : (status === 'synced' ? Date.now() : state.lastSyncedAt)
      })),

      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      tests: (initialTests && Array.isArray(initialTests) && initialTests.length > 0) ? initialTests : [],
      addTest: (test) => set((state) => ({ 
        tests: [...state.tests, { createdAt: test.createdAt || Date.now(), ...test }] 
      })),
      updateTest: (test) => set((state) => {
        const targetId = test.id;
        const cleanTargetId = targetId ? targetId.trim().replace(/[\/\s#?\[\]*]+/g, '_').replace(/[^a-zA-Z0-9_\-\.:]/g, '') : '';
        return {
          tests: state.tests.map((t) => {
            const cleanTId = t.id ? t.id.trim().replace(/[\/\s#?\[\]*]+/g, '_').replace(/[^a-zA-Z0-9_\-\.:]/g, '') : '';
            if (t.id === targetId || (cleanTargetId && cleanTId === cleanTargetId)) {
              return { ...t, ...test, updatedAt: Date.now() };
            }
            return t;
          })
        };
      }),
      deleteTest: (id) => set((state) => {
        const testToDelete = state.tests.find(t => t.id === id);
        const questionIds = new Set(testToDelete?.questions?.map(q => q.id) || []);
        
        const nextSessions = { ...state.activeTestSessions };
        delete nextSessions[id];

        try {
          safeStorage.setItem('mockly_active_test_sessions', JSON.stringify(nextSessions));
          safeStorage.removeItem('mockly_active_session_' + id);
        } catch (e) {}

        const nextBookmarks = { ...state.bookmarks };
        for (const key of Object.keys(nextBookmarks)) {
          if (questionIds.has(key)) {
            delete nextBookmarks[key];
          }
        }

        return {
          tests: state.tests.filter((t) => t.id !== id),
          attempts: state.attempts.filter((a) => a.testId !== id),
          activeTestSessions: nextSessions,
          bookmarks: nextBookmarks
        };
      }),
      importTests: (newTests) => set((state) => {
        const testMap = new Map();
        state.tests.forEach(t => testMap.set(t.id, t));
        newTests.forEach(t => {
          const testWithDate = { createdAt: t.createdAt || Date.now(), ...t };
          testMap.set(t.id, testWithDate);
        });
        return { tests: Array.from(testMap.values()) };
      }),

      attempts: [],
      addAttempt: (attempt) => set((state) => ({ 
        attempts: [
          ...state.attempts, 
          { 
            startTime: attempt.startTime || Date.now(), 
            endTime: attempt.endTime || Date.now(), 
            ...attempt 
          }
        ] 
      })),
      updateAttempt: (attempt) => set((state) => ({
        attempts: state.attempts.map((a) => a.id === attempt.id ? { ...a, ...attempt } : a)
      })),
      deleteAttempt: (id) => set((state) => ({
        attempts: state.attempts.filter((a) => a.id !== id)
      })),

      activeTestSessions: {},
      updateActiveTestSession: (testId, sessionData) => set((state) => {
        const existing = state.activeTestSessions[testId] || {
          testId,
          currentQuestionIndex: 0,
          answers: {},
          statuses: {},
          timeLeft: 0,
          timeSpent: {},
          isPaused: false,
          reportedQuestions: {},
          lastUpdated: Date.now()
        };

        const updatedSession = {
          ...existing,
          ...sessionData,
          lastUpdated: Date.now()
        };

        const nextSessions = {
          ...state.activeTestSessions,
          [testId]: updatedSession
        };

        try {
          safeStorage.setItem('mockly_active_test_sessions', JSON.stringify(nextSessions));
          safeStorage.setItem('mockly_active_session_' + testId, JSON.stringify(updatedSession));
        } catch (e) {}

        return {
          activeTestSessions: nextSessions
        };
      }),
      clearActiveTestSession: (testId) => set((state) => {
        const next = { ...state.activeTestSessions };
        delete next[testId];
        try {
          safeStorage.setItem('mockly_active_test_sessions', JSON.stringify(next));
          safeStorage.removeItem('mockly_active_session_' + testId);
        } catch (e) {}
        return { activeTestSessions: next };
      }),

      bookmarks: {},
      toggleBookmark: (questionId) => set((state) => ({
        bookmarks: {
          ...state.bookmarks,
          [questionId]: !state.bookmarks[questionId]
        }
      })),

      clearAttempts: () => {
        try {
          safeStorage.removeItem('mockly_active_test_sessions');
        } catch (e) {}
        return set({ attempts: [], activeTestSessions: {} });
      },
      clearTests: () => {
        try {
          safeStorage.removeItem('mockly_active_test_sessions');
        } catch (e) {}
        return set({ tests: [], attempts: [], activeTestSessions: {}, bookmarks: {} });
      },
      clearAllData: () => {
        try {
          safeStorage.removeItem('mockly_active_test_sessions');
        } catch (e) {}
        return set({ tests: [], attempts: [], activeTestSessions: {}, bookmarks: {} });
      }
    }),
    {
      name: 'mockly_app_storage_v2',
      storage: createJSONStorage(() => safeStorage as any),
      partialize: (state) => ({
        tests: state.tests,
        attempts: state.attempts,
        activeTestSessions: state.activeTestSessions,
        bookmarks: state.bookmarks,
        language: state.language,
      }),
      onRehydrateStorage: () => () => {
        // storage rehydrated
      }
    }
  )
);


import { create } from 'zustand';
import { Test, TestAttempt, Language, ActiveTestSession } from '../types';

export type DriveSyncStatus = 'idle' | 'saving' | 'synced' | 'offline' | 'error';

interface AppState {
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;

  driveSyncStatus: DriveSyncStatus;
  lastSyncedAt: number | null;
  setDriveSyncStatus: (status: DriveSyncStatus, lastSyncedAt?: number) => void;

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

function getInitialActiveSessions(): Record<string, ActiveTestSession> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('mockly_active_test_sessions');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading active sessions from localStorage', e);
  }
  return {};
}

export const useStore = create<AppState>()((set) => ({
  isInitialized: false,
  setIsInitialized: (val) => set({ isInitialized: val }),

  driveSyncStatus: 'idle',
  lastSyncedAt: null,
  setDriveSyncStatus: (status, lastSyncedAt) => set((state) => ({
    driveSyncStatus: status,
    lastSyncedAt: lastSyncedAt !== undefined ? lastSyncedAt : (status === 'synced' ? Date.now() : state.lastSyncedAt)
  })),

  language: 'en',
  setLanguage: (lang) => set({ language: lang }),

  tests: [],
  addTest: (test) => set((state) => ({ tests: [...state.tests, test] })),
  updateTest: (test) => set((state) => ({
    tests: state.tests.map((t) => t.id === test.id ? test : t)
  })),
  deleteTest: (id) => set((state) => {
    const testToDelete = state.tests.find(t => t.id === id);
    const questionIds = new Set(testToDelete?.questions?.map(q => q.id) || []);
    
    const nextSessions = { ...state.activeTestSessions };
    delete nextSessions[id];

    try {
      localStorage.setItem('mockly_active_test_sessions', JSON.stringify(nextSessions));
      localStorage.removeItem('mockly_active_session_' + id);
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
    newTests.forEach(t => testMap.set(t.id, t));
    return { tests: Array.from(testMap.values()) };
  }),

  attempts: [],
  addAttempt: (attempt) => set((state) => ({ attempts: [...state.attempts, attempt] })),
  updateAttempt: (attempt) => set((state) => ({
    attempts: state.attempts.map((a) => a.id === attempt.id ? attempt : a)
  })),
  deleteAttempt: (id) => set((state) => ({
    attempts: state.attempts.filter((a) => a.id !== id)
  })),

  activeTestSessions: getInitialActiveSessions(),
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
      localStorage.setItem('mockly_active_test_sessions', JSON.stringify(nextSessions));
      localStorage.setItem('mockly_active_session_' + testId, JSON.stringify(updatedSession));
    } catch (e) {}

    return {
      activeTestSessions: nextSessions
    };
  }),
  clearActiveTestSession: (testId) => set((state) => {
    const next = { ...state.activeTestSessions };
    delete next[testId];
    try {
      localStorage.setItem('mockly_active_test_sessions', JSON.stringify(next));
      localStorage.removeItem('mockly_active_session_' + testId);
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
      localStorage.removeItem('mockly_active_test_sessions');
    } catch (e) {}
    return set({ attempts: [], activeTestSessions: {} });
  },
  clearTests: () => {
    try {
      localStorage.removeItem('mockly_active_test_sessions');
    } catch (e) {}
    return set({ tests: [], attempts: [], activeTestSessions: {}, bookmarks: {} });
  },
  clearAllData: () => {
    try {
      localStorage.removeItem('mockly_active_test_sessions');
    } catch (e) {}
    return set({ tests: [], attempts: [], activeTestSessions: {}, bookmarks: {} });
  }
}));


import { create } from 'zustand';
import { Test, TestAttempt, Language, ActiveTestSession } from '../types';

interface AppState {
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;

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

export const useStore = create<AppState>()((set) => ({
  isInitialized: false,
  setIsInitialized: (val) => set({ isInitialized: val }),

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

    return {
      activeTestSessions: {
        ...state.activeTestSessions,
        [testId]: {
          ...existing,
          ...sessionData,
          lastUpdated: Date.now()
        }
      }
    };
  }),
  clearActiveTestSession: (testId) => set((state) => {
    const next = { ...state.activeTestSessions };
    delete next[testId];
    return { activeTestSessions: next };
  }),

  bookmarks: {},
  toggleBookmark: (questionId) => set((state) => ({
    bookmarks: {
      ...state.bookmarks,
      [questionId]: !state.bookmarks[questionId]
    }
  })),

  clearAttempts: () => set({ attempts: [], activeTestSessions: {} }),
  clearTests: () => set({ tests: [], attempts: [], activeTestSessions: {}, bookmarks: {} }),
  clearAllData: () => set({ tests: [], attempts: [], activeTestSessions: {}, bookmarks: {} })
}));


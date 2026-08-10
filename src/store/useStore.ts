import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Test, TestAttempt, SRSItem, Question, Language, QuestionStatus } from '../types';
import { calculateNextReview } from '../lib/utils';

interface AppState {
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

  srsItems: Record<string, SRSItem>;
  processSRSReview: (questionId: string, quality: number) => void; // quality 0-5
  clearAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      tests: [],
      addTest: (test) => set((state) => ({ tests: [...state.tests, test] })),
      updateTest: (test) => set((state) => ({
        tests: state.tests.map((t) => t.id === test.id ? test : t)
      })),
      deleteTest: (id) => set((state) => ({
        tests: state.tests.filter((t) => t.id !== id)
      })),
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

      srsItems: {},
      clearAllData: () => set({ tests: [], attempts: [], srsItems: {} }),
      processSRSReview: (questionId, quality) => set((state) => {
        const item = state.srsItems[questionId] || {
          questionId,
          nextReviewDate: Date.now(),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0
        };

        const result = calculateNextReview(quality, item.repetitions, item.easeFactor, item.interval);
        
        return {
          srsItems: {
            ...state.srsItems,
            [questionId]: {
              ...item,
              ...result
            }
          }
        };
      })
    }),
    {
      name: 'mock-test-storage-v2',
    }
  )
);

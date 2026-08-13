import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('App Store (useStore)', () => {
  beforeEach(() => {
    useStore.getState().clearAllData();
  });

  it('should initialize with default values', () => {
    const state = useStore.getState();
    expect(state.tests).toEqual([]);
    expect(state.attempts).toEqual([]);
    expect(state.language).toBe('en');
    expect(state.isInitialized).toBe(false);
  });

  it('should add a test', () => {
    const mockTest = {
      id: 'test-1',
      title: 'Mock Test 1',
      questions: [],
      sections: [],
    };
    useStore.getState().addTest(mockTest as any);
    const state = useStore.getState();
    expect(state.tests.length).toBe(1);
    expect(state.tests[0].id).toBe('test-1');
  });

  it('should update an existing test', () => {
    const mockTest = {
      id: 'test-1',
      title: 'Mock Test 1',
      questions: [],
      sections: [],
    };
    useStore.getState().addTest(mockTest as any);
    
    useStore.getState().updateTest({
      ...mockTest,
      title: 'Updated Test 1',
    } as any);

    const state = useStore.getState();
    expect(state.tests[0].title).toBe('Updated Test 1');
  });

  it('should delete a test and its associated sessions/bookmarks', () => {
    const mockTest = {
      id: 'test-1',
      title: 'Mock Test 1',
      questions: [{ id: 'q-1', text: 'Q1' }],
      sections: [],
    };
    useStore.getState().addTest(mockTest as any);
    useStore.getState().toggleBookmark('q-1');
    useStore.getState().updateActiveTestSession('test-1', { startTime: Date.now() });

    expect(useStore.getState().tests.length).toBe(1);
    expect(useStore.getState().bookmarks['q-1']).toBe(true);
    expect(useStore.getState().activeTestSessions['test-1']).toBeDefined();

    useStore.getState().deleteTest('test-1');

    const state = useStore.getState();
    expect(state.tests.length).toBe(0);
    expect(state.bookmarks['q-1']).toBeUndefined();
    expect(state.activeTestSessions['test-1']).toBeUndefined();
  });
});

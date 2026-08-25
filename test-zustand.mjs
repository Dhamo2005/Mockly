import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'

const store = createStore(
  persist(
    () => ({
      tests: [{id: 1, name: "Sample"}],
    }),
    {
      name: 'test-storage',
      storage: createJSONStorage(() => ({
        getItem: () => JSON.stringify({ state: { tests: [] }, version: 0 }),
        setItem: () => {},
        removeItem: () => {},
      }))
    }
  )
)

console.log("State after hydration:", store.getState())

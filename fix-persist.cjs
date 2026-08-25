const fs = require('fs');
const path = 'src/store/useStore.ts';
let content = fs.readFileSync(path, 'utf8');

// We will remove the setTimeout and instead add onRehydrateStorage
content = content.replace(
  /\/\/ Small timeout to allow rehydration\nsetTimeout\(cleanupDuplicates, 1000\);\n/g,
  ''
);

// We need to inject onRehydrateStorage into the persist options.
content = content.replace(
  /name: 'mockly-storage',/g,
  `name: 'mockly-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          let updates = {};
          if (state.attempts) {
            const uniqueAttempts = new Map();
            state.attempts.forEach(a => uniqueAttempts.set(a.id, a));
            if (uniqueAttempts.size !== state.attempts.length) {
              updates.attempts = Array.from(uniqueAttempts.values());
            }
          }
          if (state.tests) {
            const uniqueTests = new Map();
            state.tests.forEach(t => uniqueTests.set(t.id, t));
            if (uniqueTests.size !== state.tests.length) {
              updates.tests = Array.from(uniqueTests.values());
            }
          }
          if (Object.keys(updates).length > 0) {
            setTimeout(() => useStore.setState(updates), 0);
          }
        }
      },`
);

fs.writeFileSync(path, content, 'utf8');

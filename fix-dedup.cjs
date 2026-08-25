const fs = require('fs');
const path = 'src/store/useStore.ts';
let content = fs.readFileSync(path, 'utf8');

// replace the subscribe with a direct check
content = content.replace(
  /useStore\.subscribe\([\s\S]*\}\);\n/g,
  `
// Run once on load to clean up any existing duplicates
const cleanupDuplicates = () => {
  const state = useStore.getState();
  if (state.attempts) {
    const uniqueAttempts = new Map();
    state.attempts.forEach(a => {
      uniqueAttempts.set(a.id, a);
    });
    if (uniqueAttempts.size !== state.attempts.length) {
      useStore.setState({ attempts: Array.from(uniqueAttempts.values()) });
    }
  }
};
// Small timeout to allow rehydration
setTimeout(cleanupDuplicates, 1000);
`
);

fs.writeFileSync(path, content, 'utf8');

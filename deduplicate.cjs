const fs = require('fs');

const path = 'src/store/useStore.ts';
let content = fs.readFileSync(path, 'utf8');

// I will just add a small cleanup block after the store is created.
content += `

// Temporary cleanup for duplicate attempts on load
useStore.subscribe((state) => {
  if (state.attempts) {
    const uniqueAttempts = new Map();
    state.attempts.forEach(a => {
      uniqueAttempts.set(a.id, a);
    });
    if (uniqueAttempts.size !== state.attempts.length) {
      useStore.setState({ attempts: Array.from(uniqueAttempts.values()) });
    }
  }
});
`;
fs.writeFileSync(path, content, 'utf8');

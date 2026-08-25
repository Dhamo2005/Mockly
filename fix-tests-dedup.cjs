const fs = require('fs');
const path = 'src/store/useStore.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const cleanupDuplicates = \(\) => \{[\s\S]*\}\;/g,
  `const cleanupDuplicates = () => {
  const state = useStore.getState();
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
    useStore.setState(updates);
  }
};`
);

fs.writeFileSync(path, content, 'utf8');

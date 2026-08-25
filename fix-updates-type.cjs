const fs = require('fs');
const path = 'src/store/useStore.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /let updates = \{\};/g,
  'let updates: Partial<AppState> = {};'
);

fs.writeFileSync(path, content, 'utf8');

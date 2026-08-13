const fs = require('fs');
let text = fs.readFileSync('src/data/initialData.ts', 'utf8');
text = text.replace(/timeLimit: 600 \}/g, 'timeLimit: 900 }');
text = text.replace(/timeLimit: 900,/g, 'timeLimit: 600,'); // Wait, no I don't want this.
fs.writeFileSync('src/data/initialData.ts', text);

const fs = require('fs');
let text = fs.readFileSync('src/data/initialData.ts', 'utf8');

text = text.replace(/timeLimit: 3600, \/\/ 60 minutes/g, "timeLimit: 3600, // 60 minutes\n    settings: { strictSectionalTiming: true },");

text = text.replace(/timeLimit: 1200/g, 'timeLimit: 900');
text = text.replace(/timeLimit: 600,/g, 'timeLimit: 900,');

fs.writeFileSync('src/data/initialData.ts', text);

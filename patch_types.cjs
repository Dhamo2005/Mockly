const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(/timeLimit: number; \/\/ overall time limit in seconds/g, 'timeLimit: number; // overall time limit in seconds\n  themeColor?: string;\n  examCategory?: string;');

fs.writeFileSync('src/types.ts', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const langRegex = /\{\/\* Language Settings \*\/\}.*?<\/section>/s;
code = code.replace(langRegex, '');

fs.writeFileSync('src/pages/Settings.tsx', code);

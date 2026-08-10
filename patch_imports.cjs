const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/import\s+\{[^}]*\}\s+from\s+'recharts';?\s*/, '');
fs.writeFileSync('src/pages/Dashboard.tsx', code);

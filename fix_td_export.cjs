const fs = require('fs');
let td = fs.readFileSync('src/pages/TestDetails.tsx', 'utf8');

td = td.replace(/const handleExportTest = \(\) => \{/, 'const handleExportTest = () => {\n    if (!test) return;');
fs.writeFileSync('src/pages/TestDetails.tsx', td);

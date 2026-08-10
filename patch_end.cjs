const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/, '      </div>\n    </div>\n  );\n}');
fs.writeFileSync('src/pages/Dashboard.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/lib/driveSync.ts', 'utf8');

code = code.replace(/\} else \{\s*await fetch\(`https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?uploadType=multipart`, \{\s*method: 'POST',\s*headers: \{ Authorization: `Bearer \$\{token\}` \},\s*body: form\s*\}\);\s*\}/, '');

fs.writeFileSync('src/lib/driveSync.ts', code);

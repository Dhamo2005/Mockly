const fs = require('fs');
let code = fs.readFileSync('src/lib/driveSync.ts', 'utf8');

const replacement = `      const value = JSON.stringify({ state, version: 0 }); // Matches zustand persist format
      const file = new Blob([value], { type: 'application/json' });
      
      if (fileId) {
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME })], { type: 'application/json' }));
        form.append('file', file);
        const res = await fetch(\`https://www.googleapis.com/upload/drive/v3/files/\${fileId}?uploadType=multipart\`, {
          method: 'PATCH',
          headers: { Authorization: \`Bearer \${token}\` },
          body: form
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('Failed to PATCH to Drive:', res.status, err);
        }
      } else {
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME, parents: [folderId] })], { type: 'application/json' }));
        form.append('file', file);
        const res = await fetch(\`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart\`, {
          method: 'POST',
          headers: { Authorization: \`Bearer \${token}\` },
          body: form
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('Failed to POST to Drive:', res.status, err);
        }
      }`;

code = code.replace(/const metadata = \{\s*name: FILE_NAME,\s*parents: \[folderId\]\s*\};\s*const value = JSON\.stringify\(\{ state, version: 0 \}\);[\s\S]*?body: form\s*\}\);\s*\}/, replacement);

fs.writeFileSync('src/lib/driveSync.ts', code);

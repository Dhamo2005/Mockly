import fs from 'fs';

let text = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

const getLiveOld = `const query = filename
      ? encodeURIComponent(\`name = '\${escapeDriveQueryString(filename)}' and '\${folderId}' in parents and trashed = false\`)
      : encodeURIComponent(\`name contains '\${escapeDriveQueryString(testId)}' and '\${folderId}' in parents and trashed = false\`);`;

const getLiveNew = `const query = filename
      ? encodeURIComponent(\`name = '\${escapeDriveQueryString(filename)}' and trashed = false\`)
      : encodeURIComponent(\`name contains '\${escapeDriveQueryString(testId)}' and trashed = false\`);`;

text = text.replace(getLiveOld, getLiveNew); // for getLiveTestSessionFromDrive
text = text.replace(getLiveOld, getLiveNew); // for deleteLiveTestSessionFromDrive

fs.writeFileSync('src/lib/googleDriveSync.ts', text);

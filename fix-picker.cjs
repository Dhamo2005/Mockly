const fs = require('fs');
const path = 'src/components/GoogleDrivePickerModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /setLocalFiles\(files\.filter\(f => !f\.isFullBackup\)\);/g,
  "setLocalFiles(files);"
);

content = content.replace(
  /setLocalFiles\(result\.filter\(f => !f\.isFullBackup\)\);/g,
  "setLocalFiles(result);"
);

fs.writeFileSync(path, content, 'utf8');

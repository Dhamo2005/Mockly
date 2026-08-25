const fs = require('fs');
const path = 'src/components/GoogleDrivePickerModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /setLocalFiles\(files\);/g,
  'setLocalFiles(files.filter(f => !f.isFullBackup));'
);

content = content.replace(
  /setLocalFiles\(result\);/g,
  'setLocalFiles(result.filter(f => !f.isFullBackup));'
);

fs.writeFileSync(path, content, 'utf8');

const fs = require('fs');

function replaceConnect(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/onClick=\{connectDrive\}/g, "onClick={signInWithGoogle}");
  content = content.replace(/onClick=\{\(\) => connectDrive\(\)\}/g, "onClick={signInWithGoogle}");
  content = content.replace(/connectDrive/g, "signInWithGoogle");
  fs.writeFileSync(filePath, content, 'utf8');
}

replaceConnect('src/pages/Settings.tsx');
replaceConnect('src/pages/QuestionBank.tsx');
replaceConnect('src/pages/MockTestInterface.tsx');
replaceConnect('src/components/GoogleDrivePickerModal.tsx');

const fs = require('fs');

function fixAliases(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/connect: signInWithGoogle,/g, "connect,");
  content = content.replace(/disconnect: dissignInWithGoogle,/g, "disconnect,");
  content = content.replace(/dissignInWithGoogle/g, "disconnect");
  fs.writeFileSync(filePath, content, 'utf8');
}

fixAliases('src/pages/QuestionBank.tsx');
fixAliases('src/pages/MockTestInterface.tsx');

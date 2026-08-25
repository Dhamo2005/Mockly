const fs = require('fs');

function fixAuth(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace("const { user } = useAuth();", "const { user, signInWithGoogle } = useAuth();");
  fs.writeFileSync(filePath, content, 'utf8');
}

fixAuth('src/pages/QuestionBank.tsx');
fixAuth('src/pages/MockTestInterface.tsx');

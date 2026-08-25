const fs = require('fs');

function fixExport(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /const exportData = \[\{[\s\S]*?\}\];/,
    "const exportData = [test];"
  );
  fs.writeFileSync(path, content, 'utf8');
}

fixExport('src/pages/TestDetails.tsx');
fixExport('src/pages/QuestionBank.tsx');

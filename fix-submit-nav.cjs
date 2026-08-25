const fs = require('fs');
const path = 'src/pages/MockTestInterface.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /deleteLiveSession\(testId, test\.title\);\n\s*\}\n\s*navigate\(\`\/test-details\/\$\{test\.id\}\`\);\n\s*\};/g,
  "deleteLiveSession(testId, test.title);\n    }\n    navigate(`/review/${attempt.id}`);\n  };"
);

fs.writeFileSync(path, content, 'utf8');

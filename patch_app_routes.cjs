const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if(!code.includes('import TestDetails')) {
  code = code.replace("import Tests from './pages/Tests';", "import Tests from './pages/Tests';\nimport TestDetails from './pages/TestDetails';\nimport TestAnswers from './pages/TestAnswers';");
  
  code = code.replace('<Route path="/test/:testId" element={<MockTestInterface />} />', '<Route path="/test-details/:testId" element={<AppLayout><TestDetails /></AppLayout>} />\n        <Route path="/test-answers/:testId" element={<AppLayout><TestAnswers /></AppLayout>} />\n        <Route path="/test/:testId" element={<MockTestInterface />} />');
}
fs.writeFileSync('src/App.tsx', code);

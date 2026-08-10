const fs = require('fs');

let testsCode = fs.readFileSync('src/pages/Tests.tsx', 'utf8');
testsCode = testsCode.replace(/tests\.map\(test => \(/, 'tests.map((test, index) => (');
testsCode = testsCode.replace(/<div key=\{test\.id\}/, '<div key={`${test.id}-${index}`}');
fs.writeFileSync('src/pages/Tests.tsx', testsCode);

let qbCode = fs.readFileSync('src/pages/QuestionBank.tsx', 'utf8');
qbCode = qbCode.replace(/tests\.map\(test => \(/, 'tests.map((test, index) => (');
qbCode = qbCode.replace(/<div key=\{test\.id\}/, '<div key={`${test.id}-${index}`}');
fs.writeFileSync('src/pages/QuestionBank.tsx', qbCode);


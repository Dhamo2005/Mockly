const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

code = code.replace(/const handleJumpToQuestion = \(index: number\) => \{/g, `const handleJumpToQuestion = (index: number, forceSectionCheck?: string) => {`);

code = code.replace(/if \(targetQ\.section !== sections\[currentSectionIndex\]\) \{/, `if (targetQ.section !== (forceSectionCheck || sections[currentSectionIndex])) {`);

code = code.replace(/handleJumpToQuestion\(firstQIndex\);/g, `handleJumpToQuestion(firstQIndex, sections[nextIndex]);`);

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

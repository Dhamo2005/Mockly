const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

code = code.replace(/setSectionTimeLeft\(activeSession\.sectionTimeLeft \|\| \{\}\);/, `
      if (activeSession.sectionTimeLeft && Object.keys(activeSession.sectionTimeLeft).length > 0) {
        setSectionTimeLeft(activeSession.sectionTimeLeft);
      } else {
        const initialSectionTimes: Record<number, number> = {};
        extractedSections.forEach((secName, idx) => {
          const secDef = test.sections?.find(s => s.name === secName);
          initialSectionTimes[idx] = secDef ? secDef.timeLimit : 900;
        });
        setSectionTimeLeft(initialSectionTimes);
      }
`);

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

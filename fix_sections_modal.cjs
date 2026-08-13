const fs = require('fs');
let code = fs.readFileSync('src/components/ExamPersonalityModal.tsx', 'utf8');

const derivedSectionsLogic = `
      let initialSections = test.sections || [];
      if (initialSections.length === 0 && test.questions && test.questions.length > 0) {
        const sectionsMap = new Map<string, number>();
        test.questions.forEach(q => {
          const sec = q.section || 'General Section';
          sectionsMap.set(sec, (sectionsMap.get(sec) || 0) + 1);
        });
        initialSections = Array.from(sectionsMap.entries()).map(([name, count], index) => ({
          name,
          timeLimit: Math.floor((test.timeLimit || 3600) / sectionsMap.size),
          order: index + 1,
          questionCount: count,
          questionIds: test.questions.filter(q => q.section === name).map(q => q.id) || []
        }));
      }
      setSections(initialSections);
`;

code = code.replace(/setSections\(test\.sections \|\| \[\]\);/, derivedSectionsLogic);

fs.writeFileSync('src/components/ExamPersonalityModal.tsx', code);

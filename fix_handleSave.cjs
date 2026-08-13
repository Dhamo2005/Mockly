const fs = require('fs');
let code = fs.readFileSync('src/components/ExamPersonalityModal.tsx', 'utf8');

code = code.replace(
/const handleSave = \(\) => \{\s+onSave\(\{[\s\S]*?\}\);\s+onClose\(\);\s+\};/,
`const handleSave = () => {
    onSave({
      examCategory: examCategory.trim() || 'General Exam',
      positiveMarks: Math.max(0.1, Number(positiveMarks) || 1.0),
      negativeMarks: Math.max(0, Number(negativeMarks) || 0),
      settings: { ...test.settings, strictSectionalTiming },
      sections: sections,
      timeLimit: strictSectionalTiming ? sections.reduce((acc, s) => acc + s.timeLimit, 0) : test.timeLimit
    });
    onClose();
  };`
);

fs.writeFileSync('src/components/ExamPersonalityModal.tsx', code);

const fs = require('fs');

const exportLogic = `  const handleExportTest = (test: Test) => {
    const exportData = [{
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimit: test.timeLimit,
      themeColor: test.themeColor || "#8b5cf6",
      Sectionaltimer: test.settings?.strictSectionalTiming ? "true" : "false",
      examCategory: test.examCategory,
      sections: test.sections?.map((sec, index) => ({
        title: sec.name,
        timeLimit: sec.timeLimit,
        id: sec.id || (index + 1)
      })) || [],
      questions: test.questions?.map((q, qIndex) => {
        const secIndex = test.sections?.findIndex(s => s.name === q.section) ?? -1;
        const secId = secIndex >= 0 ? (test.sections[secIndex].id || (secIndex + 1)) : 1;
        return {
          text: q.text,
          options: q.options?.map(opt => ({
            text: opt.text,
            i: opt.id
          })) || [],
          questionNumber: qIndex + 1,
          i: q.id,
          a: q.correctOptionId,
          sectionId: secId
        };
      }) || [],
      testMode: {
        isReducedTest: true,
        questionsPerSection: test.sections && test.sections.length > 0 ? Math.floor(test.questions.length / test.sections.length) : test.questions?.length || 0,
        totalQuestions: test.questions?.length || 0,
        maximumMarks: (test.questions?.length || 0) * (test.positiveMarks || 2),
        marksPerQuestion: test.positiveMarks || 2,
        negativeMarksPerWrongAnswer: test.negativeMarks || 0.5
      }
    }];

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", \`\${test.title.replace(/\\s+/g, '_')}.json\`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };`;

// 1. QuestionBank.tsx
let qb = fs.readFileSync('src/pages/QuestionBank.tsx', 'utf8');
qb = qb.replace(/const handleExportTest = \(test: Test\) => \{[\s\S]*?downloadAnchorNode\.remove\(\);\s*\};/, exportLogic);
fs.writeFileSync('src/pages/QuestionBank.tsx', qb);

// 2. TestDetails.tsx
let td = fs.readFileSync('src/pages/TestDetails.tsx', 'utf8');
const exportLogicTd = exportLogic.replace(/\(test: Test\)/, '()');
td = td.replace(/const handleExportTest = \(\) => \{[\s\S]*?downloadAnchorNode\.remove\(\);\s*\};/, exportLogicTd);
fs.writeFileSync('src/pages/TestDetails.tsx', td);

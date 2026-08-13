const fs = require('fs');

let content = fs.readFileSync('src/pages/QuestionBank.tsx', 'utf8');

// 1. Add pendingImportTests state
content = content.replace(
  "const [testToEditPersonality, setTestToEditPersonality] = useState<Test | null>(null);",
  "const [testToEditPersonality, setTestToEditPersonality] = useState<Test | null>(null);\n  const [pendingImportTests, setPendingImportTests] = useState<any[] | null>(null);"
);

// 2. Change processJSON logic at the end
const oldProcessEnd = `    if (newTests.length > 0) {
      importTests(newTests);
      setStatus({ type: 'success', message: \`Successfully imported \${newTests.length} test paper(s).\` });
      setTimeout(() => setStatus({ type: null, message: '' }), 4000);
    } else {`;

const newProcessEnd = `    if (newTests.length > 0) {
      setPendingImportTests(newTests);
      setTestToEditPersonality(newTests[0]);
    } else {`;

if (content.includes(oldProcessEnd)) {
  content = content.replace(oldProcessEnd, newProcessEnd);
} else {
  console.log("Could not find processJSON end block");
}

// 3. Update ExamPersonalityModal usage
const oldModalUsage = `      {/* Exam Personality Modal */}
      {testToEditPersonality && (
        <ExamPersonalityModal
          isOpen={!!testToEditPersonality}
          onClose={() => setTestToEditPersonality(null)}
          test={testToEditPersonality}
          onSave={(updatedFields) => {
            updateTest({
              ...testToEditPersonality,
              ...updatedFields
            });
            setTestToEditPersonality(null);
          }}
        />
      )}`;

const newModalUsage = `      {/* Exam Personality Modal */}
      {testToEditPersonality && (
        <ExamPersonalityModal
          isOpen={!!testToEditPersonality}
          onClose={() => {
            setTestToEditPersonality(null);
            if (pendingImportTests) setPendingImportTests(null);
          }}
          test={testToEditPersonality}
          onSave={(updatedFields) => {
            if (pendingImportTests) {
              const finalizedTests = pendingImportTests.map(t => ({
                ...t,
                ...updatedFields,
                settings: { ...t.settings, ...(updatedFields.settings || {}) }
              }));
              importTests(finalizedTests);
              setStatus({ type: 'success', message: \`Successfully imported \${finalizedTests.length} test paper(s).\` });
              setTimeout(() => setStatus({ type: null, message: '' }), 4000);
              setPendingImportTests(null);
            } else {
              updateTest({
                ...testToEditPersonality,
                ...updatedFields,
                settings: { ...testToEditPersonality.settings, ...(updatedFields.settings || {}) }
              });
            }
            setTestToEditPersonality(null);
          }}
        />
      )}`;

if (content.includes(oldModalUsage)) {
  content = content.replace(oldModalUsage, newModalUsage);
} else {
  console.log("Could not find ExamPersonalityModal usage");
}

fs.writeFileSync('src/pages/QuestionBank.tsx', content);

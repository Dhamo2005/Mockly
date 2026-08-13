const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

// 1. Add isStrictSectional definition after `const test = tests.find(t => t.id === testId);`
code = code.replace(/const test = tests\.find\(t => t\.id === testId\);/, "const test = tests.find(t => t.id === testId);\n  const isStrictSectional = test?.settings?.strictSectionalTiming === true;");

// 2. Update timer logic in useEffect
code = code.replace(/if \(!test \|\| isSubmitted \|\| isPaused\) return;/, "if (!test || isSubmitted || isPaused) return;\n    const isStrictSectional = test?.settings?.strictSectionalTiming === true;");

code = code.replace(/setSectionTimeLeft\(prev => \{([\s\S]*?)\}\);/g, `
      if (isStrictSectional) {
        setSectionTimeLeft(prev => {
          const currentLeft = prev[currentSectionIndex] || 0;
          return { ...prev, [currentSectionIndex]: Math.max(0, currentLeft - 1) };
        });
      } else {
        if (timeLeft <= 1) {
          clearInterval(timer);
          handleSubmit();
        }
      }
`);

// 3. Update auto-advance logic
code = code.replace(/if \(isSubmitted \|\| isPaused \|\| !test\) return;/, "if (isSubmitted || isPaused || !test || !test.settings?.strictSectionalTiming) return;");

// 4. Update Time Left display
code = code.replace(/\{formatTime\(sectionTimeLeft\[currentSectionIndex\] \|\| 0\)\}/g, "{isStrictSectional ? formatTime(sectionTimeLeft[currentSectionIndex] || 0) : formatTime(timeLeft)}");

// 5. Update section buttons onClick
code = code.replace(/onClick=\{\(\) => \{\n\s*\/\/ Do nothing, strict sectional timing prevents jumping\n\s*\}\}/g, `onClick={() => {
                 if (isStrictSectional) return;
                 const firstQIndex = test.questions.findIndex(q => q.section === sec);
                 if (firstQIndex !== -1) handleJumpToQuestion(firstQIndex, sec);
               }}`);

// 6. Update section buttons className
code = code.replace(/"text-\[var\(--color-on-surface-variant\)\] opacity-50 bg-transparent"/g, `isStrictSectional ? "text-[var(--color-on-surface-variant)] opacity-50 bg-transparent" : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"`);

code = code.replace(/cursor-default",/g, `\${isStrictSectional ? "cursor-default" : ""}",`);

// 7. Update handleNext
code = code.replace(/if \(nextQ\.section !== currentQuestion\.section\) \{/g, `if (nextQ.section !== currentQuestion.section && test.settings?.strictSectionalTiming) {`);

code = code.replace(/if \(currentQuestion\.id === lastQ\.id\) \{/g, `if (currentQuestion.id === lastQ.id && test.settings?.strictSectionalTiming) {`);

// 8. Update handleJumpToQuestion
code = code.replace(/if \(targetQ\.section !== \(forceSectionCheck \|\| sections\[currentSectionIndex\]\)\) \{/g, `if (targetQ.section !== (forceSectionCheck || sections[currentSectionIndex]) && test.settings?.strictSectionalTiming) {`);

code = code.replace(/disabled=\{q\.section !== sections\[currentSectionIndex\]\}/g, `disabled={q.section !== sections[currentSectionIndex] && isStrictSectional}`);
code = code.replace(/q\.section !== sections\[currentSectionIndex\] && "opacity-50 grayscale cursor-not-allowed"/g, `q.section !== sections[currentSectionIndex] && isStrictSectional && "opacity-50 grayscale cursor-not-allowed"`);


fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

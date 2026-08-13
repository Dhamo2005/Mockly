const fs = require('fs');
let code = fs.readFileSync('src/pages/QuestionBank.tsx', 'utf8');

const replacement = `      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.title && Array.isArray(parsed[0]?.questions)) {
        newTests = parsed.map((test: any) => {
          const isNewFormat = test.testMode !== undefined || test.questions?.[0]?.i !== undefined || test.questions?.[0]?.sectionId !== undefined;
          
          let mappedQuestions = test.questions;
          let mappedSections = test.sections || [];
          let positiveMarks = test.positiveMarks !== undefined ? Number(test.positiveMarks) : (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
          let negativeMarks = test.negativeMarks !== undefined ? Number(test.negativeMarks) : (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
          let strictSectionalTiming = test.settings?.strictSectionalTiming === true;

          if (isNewFormat) {
             if (test.testMode) {
                positiveMarks = test.testMode.marksPerQuestion ?? positiveMarks;
                negativeMarks = test.testMode.negativeMarksPerWrongAnswer ?? negativeMarks;
             }
             if (test.Sectionaltimer === 'true' || test.Sectionaltimer === true) {
                strictSectionalTiming = true;
             }
             
             const sectionIdToName = new Map<any, string>();
             mappedSections = mappedSections.map((sec: any) => {
                const name = sec.title || sec.name;
                if (sec.id !== undefined) sectionIdToName.set(sec.id, name);
                return {
                   ...sec,
                   name: name,
                   timeLimit: sec.timeLimit,
                   id: sec.id?.toString()
                };
             });

             mappedQuestions = mappedQuestions.map((q: any) => {
                const options = Array.isArray(q.options) ? q.options.map((opt: any) => ({
                   ...opt,
                   id: opt.i || opt.id,
                   text: opt.text
                })) : [];
                return {
                   ...q,
                   id: q.i || q.id || uuidv4(),
                   text: q.text,
                   correctOptionId: q.a || q.correctOptionId,
                   section: sectionIdToName.get(q.sectionId) || q.section,
                   options
                };
             });
          } else {
             mappedQuestions = test.questions.map((q: any) => ({
               ...q,
               id: q.id || uuidv4()
             }));
          }

          return {
            ...test,
            id: test.id || uuidv4(),
            positiveMarks,
            negativeMarks,
            sections: mappedSections,
            questions: mappedQuestions,
            settings: { ...test.settings, strictSectionalTiming }
          };
        });
      } else {`;

code = code.replace(/      if \(Array\.isArray\(parsed\) && parsed\.length > 0 && parsed\[0\]\?\.title && Array\.isArray\(parsed\[0\]\?\.questions\)\) \{[\s\S]*?\}\) \}\);[\s\S]*?\} else \{/, replacement);

fs.writeFileSync('src/pages/QuestionBank.tsx', code);

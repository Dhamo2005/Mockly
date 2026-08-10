const fs = require('fs');
let code = fs.readFileSync('src/pages/TestDetails.tsx', 'utf8');

code = code.replace("import { PlayCircle, FileText, ArrowLeft, Clock, ListTodo } from 'lucide-react';", "import { PlayCircle, FileText, ArrowLeft, Clock, ListTodo, BarChart } from 'lucide-react';");
code = code.replace("const { tests } = useStore();", "const { tests, attempts } = useStore();");

const latestAttemptLogic = `
  const test = tests.find(t => t.id === testId);
  const testAttempts = attempts.filter(a => a.testId === testId && a.completed).sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  const latestAttempt = testAttempts[0];
`;
code = code.replace("const test = tests.find(t => t.id === testId);", latestAttemptLogic);

const newButtons = `        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(\`/test/\${test.id}\`)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlayCircle className="w-5 h-5" /> Start Mock Test
          </button>
          
          <button
            onClick={() => navigate(\`/test-answers/\${test.id}\`)}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-blue-600 border-2 border-blue-100 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
          >
            <FileText className="w-5 h-5" /> Show Answers
          </button>
          
          {latestAttempt && (
            <button
              onClick={() => navigate(\`/review/\${latestAttempt.id}\`)}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-xl font-medium hover:bg-indigo-50 transition-colors"
            >
              <BarChart className="w-5 h-5" /> Score Analytics
            </button>
          )}
        </div>`;

code = code.replace(/<div className="flex flex-col sm:flex-row gap-4">.*?<\/div>\s*<\/div>\s*<\/div>\s*\);/s, newButtons + '\n      </div>\n    </div>\n  );');

fs.writeFileSync('src/pages/TestDetails.tsx', code);

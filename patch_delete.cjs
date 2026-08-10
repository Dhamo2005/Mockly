const fs = require('fs');

let testsCode = fs.readFileSync('src/pages/Tests.tsx', 'utf8');
testsCode = testsCode.replace(/import \{ PlayCircle, Globe, DownloadCloud \} from 'lucide-react';/, "import { PlayCircle, Globe, DownloadCloud, Trash2 } from 'lucide-react';");
testsCode = testsCode.replace(/const \{ tests \} = useStore\(\);/, "const { tests, deleteTest } = useStore();");
testsCode = testsCode.replace(
  /<button\s+onClick=\{\(\) => navigate\(\`\/test\/\$\{test.id\}\`\)\}\s+className="relative overflow-hidden flex-shrink-0 flex items-center justify-center gap-2 bg-\[var\(--color-primary\)\] text-\[var\(--color-on-primary\)\] px-6 py-2\.5 rounded-full hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"\s*>\s*<PlayCircle className="h-4 w-4" \/> Start Test\s*<Ripple color="bg-white\/30" \/>\s*<\/button>/,
  `<div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteTest(test.id)}
                    className="p-2.5 text-[var(--color-on-surface-variant)] hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                    title="Delete Test"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(\`/test/\${test.id}\`)}
                    className="relative overflow-hidden flex-shrink-0 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] px-6 py-2.5 rounded-full hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    <PlayCircle className="h-4 w-4" /> Start Test
                    <Ripple color="bg-white/30" />
                  </button>
                </div>`
);
fs.writeFileSync('src/pages/Tests.tsx', testsCode);

let qbCode = fs.readFileSync('src/pages/QuestionBank.tsx', 'utf8');
qbCode = qbCode.replace(/import \{ Upload, FileJson, Download, CheckCircle2, AlertCircle \} from 'lucide-react';/, "import { Upload, FileJson, Download, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';");
qbCode = qbCode.replace(/const \{ tests, importTests \} = useStore\(\);/, "const { tests, importTests, deleteTest } = useStore();");
qbCode = qbCode.replace(
  /<span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Available<\/span>/,
  `<div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Available</span>
                <button 
                  onClick={() => deleteTest(test.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Test"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>`
);
fs.writeFileSync('src/pages/QuestionBank.tsx', qbCode);

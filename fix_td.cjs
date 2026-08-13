const fs = require('fs');
let code = fs.readFileSync('src/pages/TestDetails.tsx', 'utf8');

// Add Download to imports
code = code.replace(/import \{ PlayCircle, ArrowLeft, Clock, FileText, BarChart, ChevronRight, Trash2, Sliders, ShieldCheck, Sparkles \} from 'lucide-react';/, "import { PlayCircle, ArrowLeft, Clock, FileText, BarChart, ChevronRight, Trash2, Sliders, ShieldCheck, Sparkles, Download } from 'lucide-react';");

// Add handleExportTest
const exportFunc = `
  const handleExportTest = () => {
    if (!test) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(test, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", \`\${test.title.replace(/\\s+/g, '_')}.json\`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
`;

code = code.replace(/const test = tests\.find/, exportFunc + "\n  const test = tests.find");

// Add button
const exportBtn = `
                <button
                  onClick={handleExportTest}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                  title="Export Test to JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
`;

code = code.replace(/<button\s*onClick=\{\(\) => setShowDeleteModal\(true\)\}\s*className="p-2\.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"\s*title="Delete Test Paper"\s*>\s*<Trash2 className="w-5 h-5" \/>\s*<\/button>/, exportBtn + '\n                <button\n                  onClick={() => setShowDeleteModal(true)}\n                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"\n                  title="Delete Test Paper"\n                >\n                  <Trash2 className="w-5 h-5" />\n                </button>');

fs.writeFileSync('src/pages/TestDetails.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/QuestionBank.tsx', 'utf8');

const exportFunc = `
  const handleExportTest = (test: Test) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(test, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", \`\${test.title.replace(/\\s+/g, '_')}.json\`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
`;

code = code.replace(/const handleFileUpload = /, exportFunc + "\n  const handleFileUpload = ");

// Also inject the button in the UI
const exportBtn = `
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportTest(test);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Export Test to JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
`;

code = code.replace(/<Trash2 className="w-4 h-4" \/>\s*<\/button>/, '<Trash2 className="w-4 h-4" />\n                    </button>' + exportBtn);

fs.writeFileSync('src/pages/QuestionBank.tsx', code);

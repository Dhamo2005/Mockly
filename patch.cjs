const fs = require('fs');
let code = fs.readFileSync('src/pages/QuestionBank.tsx', 'utf8');

const newText = `        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <Download className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-on-surface)] mb-2">JSON Format Guide</h3>
          <p className="text-[var(--color-on-surface-variant)] text-sm mb-4">
            Our JSON format supports rich mathematical expressions (LaTeX) and multiple languages natively.
          </p>
          <ul className="text-sm text-[var(--color-on-surface-variant)] list-disc pl-5 space-y-2 mb-6">
            <li><strong>Math/LaTeX:</strong> Wrap your LaTeX formulas with <code>$</code> for inline equations (e.g., <code>{"$\\frac{1}{2}$"}</code>) or <code>$$</code> for block equations.</li>
            <li><strong>Multiple Languages:</strong> The <code>text</code> fields are objects mapping language codes to strings: <code>{"{\\"en\\": \\"Question in English\\", \\"hi\\": \\"हिंदी में प्रश्न\\"}"}</code>.</li>
            <li><strong>Markdown:</strong> Basic Markdown styling (bold, italics, code) is supported in questions and options.</li>
          </ul>
          <button 
             onClick={exportTemplateJSON}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-outline)] hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FileJson className="h-4 w-4" /> Download JSON Template
          </button>
        </div>`;

code = code.replace(/<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">\s*<div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">\s*<Download className="h-6 w-6" \/>\s*<\/div>\s*<h3 className="text-lg font-semibold text-gray-800 mb-2">Download Template<\/h3>\s*<p className="text-gray-500 text-sm mb-6">\s*Get started quickly by downloading our standard JSON template for questions and options\. JSON supports advanced features\.\s*<\/p>\s*<button\s*onClick={exportTemplateJSON}\s*className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"\s*>\s*<FileJson className="h-4 w-4" \/> Download JSON Template\s*<\/button>\s*<\/div>/g, newText);

fs.writeFileSync('src/pages/QuestionBank.tsx', code);

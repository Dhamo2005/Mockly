const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewInterface.tsx', 'utf8');

// Header spacing
code = code.replace(/mb-6 border-b border-gray-100 pb-4/g, 'mb-4 border-b border-gray-100 pb-3');

// Question number font size
code = code.replace(/text-xl/g, 'text-lg');

// Question text spacing and font size
code = code.replace(/text-lg text-slate-800 mb-8/g, 'text-base text-slate-800 mb-4');

// Options spacing and font size
code = code.replace(/p-4 rounded-xl border-2/g, 'p-3 rounded-xl border-2');
code = code.replace(/text-lg leading-relaxed markdown-body/g, 'text-base leading-relaxed markdown-body');

fs.writeFileSync('src/pages/ReviewInterface.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewInterface.tsx', 'utf8');

// Container padding
code = code.replace(/shadow-sm p-4/g, 'shadow-sm p-4 md:p-5');

// Section uppercase text
code = code.replace(/text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block/g, 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block');

// Question number font size
code = code.replace(/text-lg">Question/g, 'text-base">Question');

// Question text spacing and font size
code = code.replace(/text-base text-slate-800 mb-4 whitespace-pre-wrap leading-relaxed/g, 'text-sm text-slate-800 mb-3 whitespace-pre-wrap leading-normal');

// Option container padding and font size
code = code.replace(/flex items-center p-3 rounded-xl border-2/g, 'flex items-center p-2 rounded-lg border-2');
code = code.replace(/w-8 h-8 rounded-lg flex items-center justify-center font-bold mr-4 shrink-0/g, 'w-6 h-6 rounded flex items-center justify-center text-xs font-bold mr-3 shrink-0');
code = code.replace(/text-base leading-relaxed markdown-body/g, 'text-sm leading-normal markdown-body');

// Explanation container
code = code.replace(/rounded-xl p-4 shadow-sm/g, 'rounded-lg p-3 shadow-sm');
code = code.replace(/text-indigo-800 leading-relaxed/g, 'text-indigo-800 leading-normal text-sm');
code = code.replace(/mb-2 flex items-center gap-2/g, 'mb-1.5 flex items-center gap-2 text-sm');

fs.writeFileSync('src/pages/ReviewInterface.tsx', code);

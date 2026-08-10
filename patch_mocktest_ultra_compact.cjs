const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

// Header
code = code.replace(/text-base text-gray-800 leading-relaxed whitespace-pre-wrap mb-6 border-b border-gray-100 pb-4/g, 'text-sm text-gray-800 leading-normal whitespace-pre-wrap mb-4 border-b border-gray-100 pb-3');

// Options spacing and font size
code = code.replace(/flex items-start p-3 rounded cursor-pointer/g, 'flex items-start p-2 rounded cursor-pointer');
code = code.replace(/text-base text-gray-800 pt-\[1px\]/g, 'text-sm text-gray-800 pt-[1px]');
code = code.replace(/space-y-2/g, 'space-y-1.5');

// Sidebar padding/spacing
code = code.replace(/p-4 grid grid-cols-5 gap-3/g, 'p-3 grid grid-cols-6 gap-2');
code = code.replace(/w-10 h-10 flex items-center justify-center text-sm/g, 'w-8 h-8 flex items-center justify-center text-xs');
code = code.replace(/p-4 flex flex-col border-r/g, 'p-3 md:p-4 flex flex-col border-r');
code = code.replace(/pb-2 mb-4/g, 'pb-2 mb-3');

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

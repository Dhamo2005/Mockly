const fs = require('fs');

function compactFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // Change all p-4 to p-3, p-5 to p-4, p-6 to p-4
  code = code.replace(/\bp-4\b/g, 'p-3');
  code = code.replace(/\bp-5\b/g, 'p-4');
  code = code.replace(/\bp-6\b/g, 'p-4');

  // Change gaps
  code = code.replace(/\bgap-4\b/g, 'gap-3');
  code = code.replace(/\bgap-5\b/g, 'gap-3');
  code = code.replace(/\bgap-6\b/g, 'gap-4');

  // Change margins
  code = code.replace(/\bmb-4\b/g, 'mb-3');
  code = code.replace(/\bmb-5\b/g, 'mb-4');
  code = code.replace(/\bmb-6\b/g, 'mb-4');
  
  // Change space-y
  code = code.replace(/\bspace-y-4\b/g, 'space-y-3');
  code = code.replace(/\bspace-y-5\b/g, 'space-y-3');
  code = code.replace(/\bspace-y-6\b/g, 'space-y-4');

  // Fonts
  code = code.replace(/\btext-lg\b/g, 'text-base');
  code = code.replace(/\btext-xl\b/g, 'text-lg');
  code = code.replace(/\btext-2xl\b/g, 'text-xl');

  // Markdown body text
  code = code.replace(/\btext-base leading-normal markdown-body\b/g, 'text-sm leading-snug markdown-body');
  code = code.replace(/\btext-sm leading-normal markdown-body\b/g, 'text-sm leading-snug markdown-body');
  code = code.replace(/\btext-base text-gray-800 leading-normal\b/g, 'text-sm text-gray-800 leading-snug');

  fs.writeFileSync(filePath, code);
}

compactFile('src/App.tsx');
compactFile('src/pages/Dashboard.tsx');
compactFile('src/pages/Tests.tsx');
compactFile('src/pages/QuestionBank.tsx');
compactFile('src/pages/SRSInterface.tsx');
compactFile('src/pages/Settings.tsx');
compactFile('src/pages/MockTestInterface.tsx');
compactFile('src/pages/ReviewInterface.tsx');


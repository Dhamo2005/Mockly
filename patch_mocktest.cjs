const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

code = code.replace(/<span className="hidden sm:inline text-\[var\(--color-on-surface\)\]">Mockly<\/span>/, 
  '{test.themeColor && <style>{`#mock-test-root { --color-primary: ${test.themeColor}; }`}</style>}\n             <span className="hidden sm:inline text-[var(--color-on-surface)]">{test.examCategory || "Mockly"}</span>');
  
code = code.replace(/<div className="flex flex-col h-\[100dvh\] bg-\[var\(--color-surface\)\] overflow-hidden font-sans">/, 
  '<div id="mock-test-root" className="flex flex-col h-[100dvh] bg-[var(--color-surface)] overflow-hidden font-sans">');

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

code = code.replace(/"relative overflow-hidden px-5 py-2 text-sm font-semibold rounded-full min-w-\[100px\] transition-colors \$\{isStrictSectional \? "cursor-default" : ""\}",/g, 
'"relative overflow-hidden px-5 py-2 text-sm font-semibold rounded-full min-w-[100px] transition-colors", isStrictSectional ? "cursor-default" : "",');

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

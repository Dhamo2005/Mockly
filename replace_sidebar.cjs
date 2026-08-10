const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

const regex = /<div className="bg-\[#4db2c1\] text-white text-xs font-semibold px-3 py-1\.5 flex justify-between items-center">[\s\S]*?if \(q\.section !== currentQuestion\?\.section\) return null;/;

const newStr = `<div className="bg-[#4db2c1] text-white text-xs font-semibold flex flex-col">
             <div className="px-3 py-2 border-b border-white/20">
               <span>SECTION : {activeSidebarSection || currentQuestion?.section}</span>
             </div>
             <div className="flex overflow-x-auto custom-scrollbar">
               {sections.map(sec => (
                 <button 
                   key={sec}
                   onClick={() => setActiveSidebarSection(sec)}
                   className={cn(
                     "px-3 py-2 whitespace-nowrap transition-colors",
                     (activeSidebarSection || currentQuestion?.section) === sec ? "bg-white/20 font-bold" : "hover:bg-white/10"
                   )}
                 >
                   {sec}
                 </button>
               ))}
             </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto bg-[#eef5fa]">
            <div className="grid grid-cols-5 gap-3">
              {test.questions.map((q, idx) => {
                if (q.section !== (activeSidebarSection || currentQuestion?.section)) return null;`;

code = code.replace(regex, newStr);

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

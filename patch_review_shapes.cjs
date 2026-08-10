const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewInterface.tsx', 'utf8');

const oldHeader = `<div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                 <h3 className="font-semibold text-gray-800">Questions</h3>
               </div>`;

const newHeader = `<div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/50">
                 <h3 className="font-semibold text-gray-800">Questions</h3>
                 <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-gray-600">
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 bg-[#25b55d] rounded-t-full rounded-b-sm border border-[#25b55d]"></div>
                       <span>Correct</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 bg-[#e53935] rounded-b-full rounded-t-sm border border-[#e53935]"></div>
                       <span>Incorrect</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-4 h-4 bg-white border border-gray-400 rounded-sm"></div>
                       <span>Skipped</span>
                    </div>
                 </div>
               </div>`;
               
code = code.replace(oldHeader, newHeader);

const oldButtonRegex = /className=\{cn\([\s\S]*?"w-9 h-9 flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 mx-auto rounded-md shadow-sm border",[\s\S]*?!uAns \? "bg-white text-slate-500 border-slate-300" : isCorr \? "bg-emerald-500 text-white border-emerald-600" : "bg-rose-500 text-white border-rose-600",[\s\S]*?isActive && "ring-2 ring-indigo-500 ring-offset-2 scale-105"[\s\S]*?\)\}/;

const newButton = `className={cn(
                               "w-9 h-9 flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 mx-auto",
                               !uAns ? "bg-white text-gray-700 border border-gray-400 rounded-sm" : isCorr ? "bg-[#25b55d] text-white rounded-t-full rounded-b-sm border border-[#25b55d]" : "bg-[#e53935] text-white rounded-b-full rounded-t-sm border border-[#e53935]",
                               isActive && "ring-2 ring-indigo-500 ring-offset-2 scale-105"
                             )}`;

code = code.replace(oldButtonRegex, newButton);

fs.writeFileSync('src/pages/ReviewInterface.tsx', code);

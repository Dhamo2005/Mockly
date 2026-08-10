const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewInterface.tsx', 'utf8');

const oldSidebar = `<div className="bg-[var(--color-surface)] p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[300px] lg:h-[500px]">
               <h3 className="font-semibold text-gray-800 mb-3">Questions</h3>
               <div className="overflow-y-auto flex-1 pr-2 space-y-2">
                 {filteredQuestions.map(q => {
                   const idx = test.questions.findIndex(tq => tq.id === q.id);
                   const uAns = attempt.answers[q.id];
                   const isCorr = uAns === q.correctOptionId;
                   return (
                     <button
                       key={q.id}
                       onClick={() => setCurrentQuestionIndex(idx)}
                       className={cn(
                         "w-full text-left px-3 py-2 rounded-lg border text-sm flex items-center justify-between transition-colors",
                         idx === currentQuestionIndex ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 hover:bg-slate-50",
                         !uAns ? "border-l-4 border-l-slate-400" : isCorr ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-rose-500"
                       )}
                     >
                       <span className="font-medium text-slate-700">Question {idx + 1}</span>
                       {!uAns ? <span className="text-slate-400 text-xs font-bold">SKIPPED</span> : isCorr ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                     </button>
                   )
                 })}
                 {filteredQuestions.length === 0 && (
                   <p className="text-sm text-slate-500 text-center py-4">No questions match filter.</p>
                 )}
               </div>
            </div>`;

const newSidebar = `<div className="bg-[var(--color-surface)] rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[300px] lg:h-[500px]">
               <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                 <h3 className="font-semibold text-gray-800">Questions</h3>
               </div>
               <div className="overflow-y-auto flex-1 bg-slate-50/50 flex flex-col custom-scrollbar">
                 {Array.from(new Set(filteredQuestions.map(q => q.section))).map(sec => (
                   <div key={sec} className="mb-2">
                     <div className="bg-slate-200/60 text-slate-700 text-xs font-bold px-3 py-1.5 sticky top-0 z-10 backdrop-blur-sm">
                       <span>{sec}</span>
                     </div>
                     <div className="p-3 grid grid-cols-5 gap-2">
                       {filteredQuestions.map(q => {
                         if (q.section !== sec) return null;
                         const idx = test.questions.findIndex(tq => tq.id === q.id);
                         const uAns = attempt.answers[q.id];
                         const isCorr = uAns === q.correctOptionId;
                         const isActive = currentQuestionIndex === idx;
                         
                         return (
                           <button
                             key={q.id}
                             onClick={() => setCurrentQuestionIndex(idx)}
                             className={cn(
                               "w-9 h-9 flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 mx-auto rounded-md shadow-sm border",
                               !uAns ? "bg-white text-slate-500 border-slate-300" : isCorr ? "bg-emerald-500 text-white border-emerald-600" : "bg-rose-500 text-white border-rose-600",
                               isActive && "ring-2 ring-indigo-500 ring-offset-2 scale-105"
                             )}
                           >
                             {idx + 1}
                           </button>
                         )
                       })}
                     </div>
                   </div>
                 ))}
                 {filteredQuestions.length === 0 && (
                   <p className="text-sm text-slate-500 text-center py-8">No questions match filter.</p>
                 )}
               </div>
            </div>`;

code = code.replace(oldSidebar, newSidebar);
fs.writeFileSync('src/pages/ReviewInterface.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewInterface.tsx', 'utf8');

const regex = /className=\{cn\([\s\S]*?"w-9 h-9 flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 mx-auto",[\s\S]*?!uAns \? "bg-white text-gray-700 border border-gray-400 rounded-sm" : isCorr \? "bg-\[#25b55d\] text-white rounded-t-full rounded-b-sm border border-\[#25b55d\]" : "bg-\[#e53935\] text-white rounded-b-full rounded-t-sm border border-\[#e53935\]",[\s\S]*?isActive && "ring-2 ring-indigo-500 ring-offset-2 scale-105"[\s\S]*?\)\}[\s\S]*?>[\s\S]*?\{idx \+ 1\}[\s\S]*?<\/button>/m;

const replacement = `className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'analytics' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'questions' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Questions
            </div>
          </button>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-sm text-gray-500 font-medium">Score</p>
            <p className="text-2xl font-bold text-blue-600">{attempt.score} / {attempt.totalQuestions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Accuracy</p>
            <p className="text-2xl font-bold text-green-600">
              {attempt.totalQuestions > 0 ? Math.round((attempt.correctAnswers / (attempt.correctAnswers + attempt.incorrectAnswers || 1)) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
      
      {activeTab === 'analytics' ? (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 bg-[var(--color-surface)] p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Section Performance</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="correct" name="Correct" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="incorrect" name="Incorrect" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="unanswered" name="Skipped" stackId="a" fill="#9ca3af" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 shrink-0">
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Filters</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button 
                  onClick={() => setFilter('all')}
                  className={cn("py-2 px-3 rounded border font-medium", filter === 'all' ? "bg-gray-800 text-white border-gray-800" : "bg-gray-50 text-gray-700 border-gray-200")}
                >
                  All ({test.questions.length})
                </button>
                <button 
                  onClick={() => setFilter('correct')}
                  className={cn("py-2 px-3 rounded border font-medium flex justify-center items-center gap-1", filter === 'correct' ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-700 border-emerald-200")}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> ({attempt.correctAnswers})
                </button>
                <button 
                  onClick={() => setFilter('incorrect')}
                  className={cn("py-2 px-3 rounded border font-medium flex justify-center items-center gap-1", filter === 'incorrect' ? "bg-rose-600 text-white border-rose-600" : "bg-rose-50 text-rose-700 border-rose-200")}
                >
                  <XCircle className="w-3.5 h-3.5" /> ({attempt.incorrectAnswers})
                </button>
                <button 
                  onClick={() => setFilter('unanswered')}
                  className={cn("py-2 px-3 rounded border font-medium flex justify-center items-center gap-1", filter === 'unanswered' ? "bg-slate-600 text-white border-slate-600" : "bg-slate-100 text-slate-600 border-slate-300")}
                >
                  Skip ({test.questions.length - attempt.correctAnswers - attempt.incorrectAnswers})
                </button>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[300px] lg:h-[500px]">
               <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/50">
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
                               "w-9 h-9 flex items-center justify-center text-xs font-bold transition-all hover:opacity-80 mx-auto",
                               !uAns ? "bg-white text-gray-700 border border-gray-400 rounded-sm" : isCorr ? "bg-[#25b55d] text-white rounded-t-full rounded-b-sm border border-[#25b55d]" : "bg-[#e53935] text-white rounded-b-full rounded-t-sm border border-[#e53935]",
                               isActive && "ring-2 ring-indigo-500 ring-offset-2 scale-105"
                             )}
                           >
                             {idx + 1}
                           </button>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/ReviewInterface.tsx', code);

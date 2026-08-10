const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

const regex = /<div className="bg-\[#4db2c1\] text-white text-xs font-semibold flex flex-col">[\s\S]*?<\/div>\s*<\/div>\s*<div className="mt-auto p-2 border-t border-gray-300 bg-white">/;

const newStr = `<div className="flex-1 overflow-y-auto bg-[#eef5fa] flex flex-col">
            {sections.map(sec => (
              <div key={sec} className="mb-4">
                <div className="bg-[#4db2c1] text-white text-xs font-semibold px-3 py-2 sticky top-0 z-10 shadow-sm">
                  <span>SECTION : {sec}</span>
                </div>
                <div className="p-4 grid grid-cols-5 gap-3">
                  {test.questions.map((q, idx) => {
                    if (q.section !== sec) return null;
                    const status = statuses[q.id] || 'unvisited';
                    const isActive = currentQuestionIndex === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => handleJumpToQuestion(idx)}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center text-sm font-semibold transition-all hover:opacity-80 mx-auto",
                          getStatusShapeClasses(status),
                          isActive && "ring-2 ring-blue-600 ring-offset-1 scale-105"
                        )}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto p-2 border-t border-gray-300 bg-white">`;

code = code.replace(regex, newStr);

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

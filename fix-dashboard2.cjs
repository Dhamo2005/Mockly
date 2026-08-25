const fs = require('fs');
const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rewrite getFolderContents
content = content.replace(
  /const getFolderContents = \([\s\S]*?const { folders, testsInFolder } = getFolderContents\(currentPath\);/,
  `const getFolderContents = (path: string[]) => {
    const folders = new Set<string>();
    const testsUnderPath: Test[] = [];
    tests.forEach(test => {
      const testPath: string[] = [];
      if (test.examCategory) testPath.push(test.examCategory);
      if (test.exam?.tier) testPath.push(test.exam.tier);
      let matchesPath = true;
      for (let i = 0; i < path.length; i++) {
        if (testPath[i] !== path[i]) {
          matchesPath = false;
          break;
        }
      }
      if (matchesPath) {
        testsUnderPath.push(test);
        if (testPath.length > path.length) {
          folders.add(testPath[path.length]);
        }
      }
    });
    return {
      folders: Array.from(folders).sort(),
      testsUnderPath
    };
  };

  const { folders, testsUnderPath } = getFolderContents(currentPath);
  const testIdsUnderPath = new Set(testsUnderPath.map(t => t.id));
  const pathAttempts = attempts.filter(a => testIdsUnderPath.has(a.testId));`
);

// 2. Change attempts to pathAttempts for the stats
content = content.replace(
  "const completedAttempts = attempts.filter(a => a.completed);",
  "const completedAttempts = pathAttempts.filter(a => a.completed);"
);

// 3. Change attempts to pathAttempts in Recent Activity
content = content.replace(
  "{attempts.slice().reverse().slice(0, 5).map((attempt, index) => {",
  "{pathAttempts.slice().reverse().slice(0, 5).map((attempt, index) => {"
);

content = content.replace(
  "{attempts.length === 0 && (",
  "{pathAttempts.length === 0 && ("
);

// 4. Remove testsInFolder rendering
content = content.replace(/\{\/\* Tests \*\/\}.*?(?=\{\/\* Delete Attempt Modal \*\/\})/s, (match) => {
  // We want to remove the testsInFolder block but keep the end tags for AnimatePresence, etc.
  // Actually, it's easier to just do string replacement.
  return `              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
             <p className="text-slate-500 text-[14px]">No tests imported yet. Go to Question Bank to import tests.</p>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="mt-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100/80 bg-white/50 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-800">
              Recent Activity {currentPath.length > 0 ? \` in \${currentPath[currentPath.length - 1]}\` : ''}
            </h3>
          </div>
          <div className="divide-y divide-slate-100/80">
            {pathAttempts.slice().reverse().slice(0, 5).map((attempt, index) => {
              const test = tests.find(t => t.id === attempt.testId);
              if (!test) return null;
              
              const positiveMarks = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
              const maxMarks = (test.questions?.length || 1) * positiveMarks;
              const percentage = Math.max(0, Math.round(((attempt.score || 0) / maxMarks) * 100)) || 0;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  key={attempt.id} 
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-[15px] text-slate-800 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate(\`/test-details/\${test.id}\`)}>
                        {test.title}
                      </h4>
                      {getAttemptDate(attempt) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100/70 px-1.5 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {getAttemptDate(attempt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[13px]">
                      <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: \`\${percentage}%\` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-600 w-8">{percentage}%</span>
                      </div>
                      <span className="text-slate-500 font-medium whitespace-nowrap">
                        Score: <span className="text-slate-700 font-semibold">{attempt.score?.toFixed(1)}</span> / {maxMarks}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 sm:ml-3">
                    <button 
                      onClick={() => setAttemptToDelete(attempt.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete attempt record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(\`/review/\${attempt.id}\`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold text-[13px] rounded-lg hover:bg-blue-100 transition-colors ml-1"
                    >
                      Analytics
                    </button>
                  </div>
                </motion.div>
              );
            })}
            
            {pathAttempts.length === 0 && (
              <div className="py-10 px-4 text-center text-slate-500 text-[15px]">
                No recent activity in this folder.
              </div>
            )}
          </div>
        </div>
      </motion.div>
`;
});

fs.writeFileSync(path, content, 'utf8');

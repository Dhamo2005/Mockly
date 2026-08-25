const fs = require('fs');

const path = 'src/pages/Tests.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStart = "{activeTab === 'imported' && (";
const targetEnd = "{activeTab === 'online' && (";

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end index.");
    process.exit(1);
}

const replacement = `{activeTab === 'imported' && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
          >
            {/* Breadcrumbs */}
            {tests.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white px-4 py-3 rounded-xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-x-auto whitespace-nowrap hide-scrollbar">
                <button 
                  onClick={() => setCurrentPath([])}
                  className={\`flex items-center gap-1.5 transition-colors \${currentPath.length === 0 ? 'text-blue-600' : 'hover:text-slate-800'}\`}
                >
                  <Home className="w-4 h-4" /> Mockly App Data
                </button>
                {currentPath.map((folder, idx) => (
                  <React.Fragment key={folder}>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <button 
                      onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
                      className={\`transition-colors \${idx === currentPath.length - 1 ? 'text-blue-600' : 'hover:text-slate-800'}\`}
                    >
                      {folder}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              <AnimatePresence>
                {/* Folders */}
                {folders.map(folder => (
                  <motion.div 
                    variants={itemVariants}
                    exit="exit"
                    layout
                    key={\`folder-\${folder}\`}
                    onClick={() => setCurrentPath([...currentPath, folder])}
                    className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex items-center gap-4 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-blue-500 rounded-[12px] flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[15px] text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {folder}
                      </h4>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </motion.div>
                ))}

                {/* Tests */}
                {testsInFolder.map((test, index) => {
                  const pos = test.positiveMarks ?? (test.examCategory === 'SSC CGL' ? 2.0 : 1.0);
                  const neg = test.negativeMarks ?? (test.examCategory === 'SSC CGL' ? 0.5 : 0.25);
                  const isNoNeg = neg === 0;
                  
                  return (
                    <motion.div 
                      variants={itemVariants}
                      exit="exit"
                      layout
                      key={test.id} 
                      onClick={() => navigate(\`/test-details/\${test.id}\`)}
                      className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex gap-3.5 group"
                    >
                      {/* Left Icon Area */}
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors rounded-[12px] flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      </div>
                      
                      {/* Right Content */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Title */}
                        <h4 className="font-semibold text-[15px] text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1.5">
                          {test.title}
                        </h4>
                        
                        {/* Info Pills Row 1 */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-1.5">
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {getTestDisplayDate(test)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                            <AlignLeft className="w-3 h-3 text-slate-400" />
                            {test.questions.length} Qs
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {Math.floor(test.timeLimit / 60)}m
                          </span>
                        </div>
                        
                        {/* Info Pills Row 2 */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-2.5">
                          <span className={\`px-1.5 py-0.5 rounded-md border font-medium \${
                            isNoNeg ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50' : 'bg-blue-50/50 text-blue-600 border-blue-100/50'
                          }\`}>
                            {isNoNeg ? 'No Neg' : \`+\${pos.toFixed(1)} / -\${neg.toFixed(2)}\`}
                          </span>
                          {test.settings?.strictSectionalTiming && !test.settings?.allowSectionSwitching && (
                            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100/50 font-medium">
                              <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                              Strict Sections
                            </span>
                          )}
                          {test.settings?.allowSectionSwitching && (
                            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100/50 font-medium">
                              <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                              Switch Sections
                            </span>
                          )}
                          {activeTestSessions && activeTestSessions[test.id] && (
                            <span className="flex items-center gap-1 text-amber-600 bg-amber-50/50 px-1.5 py-0.5 rounded-md border border-amber-100/50 font-medium">
                              <Clock className="w-3 h-3 text-amber-500" />
                              In Progress
                            </span>
                          )}
                        </div>
                        
                        {/* Divider */}
                        <div className="h-px border-b border-dashed border-slate-100 mb-2.5 w-full" />
                        
                        {/* Bottom Actions Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-0.5 -ml-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTestToShare(test);
                              }}
                              className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                              title="Share Mock Test"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTestToDelete({ id: test.id, title: test.title });
                              }}
                              className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                              title="Delete Test"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(\`/test-details/\${test.id}\`);
                            }}
                            className={cn(
                              "flex items-center gap-1 px-3.5 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all",
                              activeTestSessions && activeTestSessions[test.id]
                                ? "bg-slate-50 border border-slate-100/80 text-slate-700 hover:bg-slate-100"
                                : "bg-blue-600 border border-transparent text-white hover:bg-blue-700 shadow-sm"
                            )}
                          >
                            {activeTestSessions && activeTestSessions[test.id] ? null : <PlayCircle className="w-4 h-4" />}
                            {activeTestSessions && activeTestSessions[test.id] ? "Resume" : "Start"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            {tests.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
                <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-[2rem] flex items-center justify-center mb-6 relative z-10">
                  <Database className="w-10 h-10 text-blue-500/80" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight relative z-10">No questions found</h3>
                <p className="text-slate-500 mt-3 mb-8 max-w-sm relative z-10 leading-relaxed">
                  Start practicing by importing a mock test bundle. You can upload custom JSON question banks to get started.
                </p>
                <button
                  onClick={() => navigate('/bank')}
                  className="relative z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 group"
                >
                  <DownloadCloud className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  Import Mock Test
                  <Ripple color="bg-white/20" />
                </button>
              </motion.div>
            )}
            
            {tests.length > 0 && folders.length === 0 && testsInFolder.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
              >
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Empty Folder</h3>
                <p className="text-slate-500 mt-2">No tests found in this directory.</p>
              </motion.div>
            )}
          </motion.div>
        )}

        `;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync(path, content, 'utf8');

const fs = require('fs');
const path = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Test to imports
content = content.replace("import { getAttemptDate } from '../lib/dateUtils';", "import { getAttemptDate } from '../lib/dateUtils';\nimport { Test } from '../types';\nimport { getTestDisplayDate } from '../lib/dateUtils';");

// 2. Add icons to lucide-react import
content = content.replace("import { PlayCircle, CheckCircle2, Clock, BarChart, Trash2, ArrowRight, Loader2, Calendar, RefreshCw, HardDrive } from 'lucide-react';", "import { PlayCircle, CheckCircle2, Clock, BarChart, Trash2, ArrowRight, Loader2, Calendar, RefreshCw, HardDrive, Home, ChevronRight, Folder, BookOpen, AlignLeft, ArrowLeftRight } from 'lucide-react';");

// 3. Add currentPath and getFolderContents
content = content.replace(
  "  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);",
  "  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);\n  const [currentPath, setCurrentPath] = useState<string[]>([]);\n\n  // Auto-navigate up if current path becomes empty\n  React.useEffect(() => {\n    if (currentPath.length > 0) {\n      let pathHasTests = false;\n      for (const test of tests) {\n        const testPath = [];\n        if (test.examCategory) testPath.push(test.examCategory);\n        if (test.exam?.tier) testPath.push(test.exam.tier);\n        \n        let matches = true;\n        for (let i = 0; i < currentPath.length; i++) {\n          if (testPath[i] !== currentPath[i]) {\n            matches = false;\n            break;\n          }\n        }\n        if (matches) {\n          pathHasTests = true;\n          break;\n        }\n      }\n      \n      if (!pathHasTests) {\n        setCurrentPath(prev => prev.slice(0, -1));\n      }\n    }\n  }, [tests, currentPath]);\n\n  const getFolderContents = (path: string[]) => {\n    const folders = new Set<string>();\n    const testsInFolder: Test[] = [];\n    tests.forEach(test => {\n      const testPath: string[] = [];\n      if (test.examCategory) testPath.push(test.examCategory);\n      if (test.exam?.tier) testPath.push(test.exam.tier);\n      let matchesPath = true;\n      for (let i = 0; i < path.length; i++) {\n        if (testPath[i] !== path[i]) {\n          matchesPath = false;\n          break;\n        }\n      }\n      if (matchesPath) {\n        if (testPath.length > path.length) {\n          folders.add(testPath[path.length]);\n        } else {\n          testsInFolder.push(test);\n        }\n      }\n    });\n    return {\n      folders: Array.from(folders).sort(),\n      testsInFolder\n    };\n  };\n\n  const { folders, testsInFolder } = getFolderContents(currentPath);"
);

// 4. Inject the Folder UI just before Recent Activity
const folderUI = `
      {/* Folder Structure */}
      <motion.div variants={itemVariants} className="mt-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-bold text-slate-800">Test Library</h3>
        </div>
        
        {tests.length > 0 ? (
          <div className="space-y-3">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white px-4 py-3 rounded-xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-x-auto whitespace-nowrap hide-scrollbar">
              <button 
                onClick={() => setCurrentPath([])}
                className={\`flex items-center gap-1.5 transition-colors \${currentPath.length === 0 ? 'text-blue-600' : 'hover:text-slate-800'}\`}
              >
                <Home className="w-4 h-4" /> Home
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
                {testsInFolder.map((test) => {
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
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors rounded-[12px] flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h4 className="font-semibold text-[15px] text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1.5">
                          {test.title}
                        </h4>
                        
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
                        
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                          <span className={\`px-1.5 py-0.5 rounded-md border font-medium \${
                            isNoNeg ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50' : 'bg-blue-50/50 text-blue-600 border-blue-100/50'
                          }\`}>
                            {isNoNeg ? 'No Neg' : \`+\${pos.toFixed(1)} / -\${neg.toFixed(2)}\`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
             <p className="text-slate-500 text-[14px]">No tests imported yet. Go to Question Bank to import tests.</p>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="mt-4">`;

content = content.replace("      <motion.div variants={itemVariants} className=\"mt-4\">", folderUI);

fs.writeFileSync(path, content, 'utf8');

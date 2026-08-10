const fs = require('fs');
let code = fs.readFileSync('src/pages/ReviewInterface.tsx', 'utf8');

code = code.replace(/import \{ CheckCircle, XCircle, ArrowLeft, BrainCircuit, BarChart2, ListTodo, AlertTriangle \} from 'lucide-react';/, "import { CheckCircle, XCircle, ArrowLeft, BrainCircuit, BarChart2, ListTodo, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';");

const navFns = `
  const currentFilteredIndex = filteredQuestions.findIndex(q => q.id === currentQuestion?.id);
  
  const handlePrevious = () => {
    if (currentFilteredIndex > 0) {
      const prevQ = filteredQuestions[currentFilteredIndex - 1];
      const origIdx = test.questions.findIndex(tq => tq.id === prevQ.id);
      setCurrentQuestionIndex(origIdx);
    }
  };

  const handleNext = () => {
    if (currentFilteredIndex < filteredQuestions.length - 1) {
      const nextQ = filteredQuestions[currentFilteredIndex + 1];
      const origIdx = test.questions.findIndex(tq => tq.id === nextQ.id);
      setCurrentQuestionIndex(origIdx);
    }
  };
`;

code = code.replace(/const filteredQuestions = test.questions.filter\(q => \{[\s\S]*?return true;[\s\S]*?\}\);/m, (match) => {
  return match + navFns;
});

const buttonsUI = `
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleGoogleSearch}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Search Google for Explanations
                </button>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                   <button
                     onClick={handlePrevious}
                     disabled={currentFilteredIndex <= 0}
                     className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <ChevronLeft className="w-4 h-4" />
                     Previous
                   </button>
                   <button
                     onClick={handleNext}
                     disabled={currentFilteredIndex >= filteredQuestions.length - 1}
                     className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Next
                     <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
`;

code = code.replace(/<div className="mt-4">\s*<button\s*onClick=\{handleGoogleSearch\}[\s\S]*?<\/button>\s*<\/div>/m, buttonsUI);

fs.writeFileSync('src/pages/ReviewInterface.tsx', code);

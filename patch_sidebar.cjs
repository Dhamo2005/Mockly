const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

// First, inject activeSidebarSection state
const stateInjection = `  const [activeSidebarSection, setActiveSidebarSection] = useState<string>('');
  
  useEffect(() => {
    if (currentQuestion) {
      setActiveSidebarSection(currentQuestion.section);
    }
  }, [currentQuestionIndex, currentQuestion]);`;

code = code.replace(/  if \(\!test\) return <div>Test not found<\/div>;/, stateInjection + '\n\n  if (!test) return <div>Test not found</div>;');


// Then replace the sidebar section part
const oldSidebarSection = `          <div className="bg-[#4db2c1] text-white text-xs font-semibold px-3 py-1.5 flex justify-between items-center">
             <span>SECTION : {currentQuestion?.section}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto bg-[#eef5fa]">
            <div className="grid grid-cols-5 gap-3">
              {test.questions.map((q, idx) => {
                if (q.section !== currentQuestion?.section) return null;`;

const newSidebarSection = `          <div className="bg-[#4db2c1] text-white text-xs font-semibold flex flex-col">
             <div className="px-3 py-2 border-b border-white/20">
               <span>SECTION : {activeSidebarSection}</span>
             </div>
             <div className="flex overflow-x-auto custom-scrollbar">
               {sections.map(sec => (
                 <button 
                   key={sec}
                   onClick={() => setActiveSidebarSection(sec)}
                   className={cn(
                     "px-3 py-2 whitespace-nowrap transition-colors",
                     activeSidebarSection === sec ? "bg-white/20 font-bold" : "hover:bg-white/10"
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
                if (q.section !== activeSidebarSection) return null;`;

code = code.replace(oldSidebarSection, newSidebarSection);
fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

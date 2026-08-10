const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');

const oldStateInjection = `  const [activeSidebarSection, setActiveSidebarSection] = useState<string>('');
  
  useEffect(() => {
    if (currentQuestion) {
      setActiveSidebarSection(currentQuestion.section);
    }
  }, [currentQuestionIndex, currentQuestion]);

  if (!test) return <div>Test not found</div>;`;

const newStateInjection = `  if (!test) return <div>Test not found</div>;
  const currentQuestion = test.questions[currentQuestionIndex];

  const [activeSidebarSection, setActiveSidebarSection] = useState<string>('');
  
  useEffect(() => {
    if (currentQuestion) {
      setActiveSidebarSection(currentQuestion.section);
    }
  }, [currentQuestionIndex, currentQuestion]);`;

code = code.replace(oldStateInjection, '');
code = code.replace(`  const currentQuestion = test.questions[currentQuestionIndex];`, newStateInjection);

fs.writeFileSync('src/pages/MockTestInterface.tsx', code);

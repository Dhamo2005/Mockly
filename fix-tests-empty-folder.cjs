const fs = require('fs');
const path = 'src/pages/Tests.tsx';
let content = fs.readFileSync(path, 'utf8');

// We want to add an effect that checks if the currentPath is valid (i.e., at least one test has a prefix matching currentPath).
// If not, we pop the path.

const effectString = `
  // Auto-navigate up if current path becomes empty (e.g. after deleting the last test in a category)
  React.useEffect(() => {
    if (currentPath.length > 0) {
      let pathHasTests = false;
      for (const test of tests) {
        const testPath = [];
        if (test.examCategory) testPath.push(test.examCategory);
        if (test.exam?.tier) testPath.push(test.exam.tier);
        
        let matches = true;
        for (let i = 0; i < currentPath.length; i++) {
          if (testPath[i] !== currentPath[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          pathHasTests = true;
          break;
        }
      }
      
      if (!pathHasTests) {
        setCurrentPath(prev => prev.slice(0, -1));
      }
    }
  }, [tests, currentPath]);
`;

// Insert the effect after the currentPath state declaration
content = content.replace(
  /const \[currentPath, setCurrentPath\] = useState<string\[\]>\(\[\]\);/g,
  `const [currentPath, setCurrentPath] = useState<string[]>([]);\n${effectString}`
);

fs.writeFileSync(path, content, 'utf8');

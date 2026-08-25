const fs = require('fs');
const path = 'src/pages/MockTestInterface.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const handleSubmit = \(\) => \{\n    if \(isSubmitted\) return;\n    setIsSubmitted\(true\);/g,
  'const handleSubmit = () => {\n    if (isSubmitted || isSubmittedRef.current) return;\n    setIsSubmitted(true);\n    isSubmittedRef.current = true;'
);

fs.writeFileSync(path, content, 'utf8');

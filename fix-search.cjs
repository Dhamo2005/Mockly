const fs = require('fs');

function fixSearch() {
  const path = 'src/components/GlobalSearch.tsx';
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace(
    /test\.title\.toLowerCase\(\)\.includes\(lowerQuery\)/,
    "(typeof test.title === 'string' ? test.title.toLowerCase().includes(lowerQuery) : String(test.title || '').toLowerCase().includes(lowerQuery))"
  );
  
  content = content.replace(
    /test\.description && test\.description\.toLowerCase\(\)\.includes\(lowerQuery\)/,
    "test.description && String(test.description).toLowerCase().includes(lowerQuery)"
  );

  content = content.replace(
    /test\.examCategory && test\.examCategory\.toLowerCase\(\)\.includes\(lowerQuery\)/,
    "test.examCategory && String(test.examCategory).toLowerCase().includes(lowerQuery)"
  );
  
  fs.writeFileSync(path, content, 'utf8');
}

fixSearch();

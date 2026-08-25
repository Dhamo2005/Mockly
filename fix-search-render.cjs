const fs = require('fs');

function fixSearchRender() {
  const path = 'src/components/GlobalSearch.tsx';
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace(
    /\{test\.title\}/g,
    "{typeof test.title === 'string' ? test.title : String(test.title || 'Untitled Test')}"
  );
  
  content = content.replace(
    /\{test\.examCategory\}/g,
    "{typeof test.examCategory === 'string' ? test.examCategory : String(test.examCategory || '')}"
  );
  
  fs.writeFileSync(path, content, 'utf8');
}

fixSearchRender();

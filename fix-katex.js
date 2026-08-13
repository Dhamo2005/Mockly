const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace('.katex * {\n    border-color: currentColor;\n}', '.katex * {\n    border-color: currentColor !important;\n}');
fs.writeFileSync('src/index.css', css);

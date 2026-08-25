const fs = require('fs');

const pathSettings = 'src/pages/Settings.tsx';
let contentSettings = fs.readFileSync(pathSettings, 'utf8');
contentSettings = contentSettings.replace(/Mockly App Data/g, 'Home');
fs.writeFileSync(pathSettings, contentSettings, 'utf8');

const pathQb = 'src/pages/QuestionBank.tsx';
let contentQb = fs.readFileSync(pathQb, 'utf8');
contentQb = contentQb.replace(/Mockly App Data/g, 'Home');
fs.writeFileSync(pathQb, contentQb, 'utf8');


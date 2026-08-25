const fs = require('fs');
const path = 'src/pages/QuestionBank.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /import \{ GoogleDrivePickerModal \} from '\.\.\/components\/GoogleDrivePickerModal';\n/,
  ""
);

content = content.replace(
  /  const \[showDrivePicker, setShowDrivePicker\] = useState\(false\);\n/,
  ""
);

content = content.replace(
  /      <GoogleDrivePickerModal\n        isOpen=\{showDrivePicker\}\n        onClose=\{\(\) => setShowDrivePicker\(false\)\}\n      \/>\n/,
  ""
);

fs.writeFileSync(path, content, 'utf8');

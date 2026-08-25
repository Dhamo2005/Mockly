const fs = require('fs');
const path = 'src/components/GoogleDrivePickerModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({\n  isOpen,\n  onClose,\n  onSelectTest,\n}) => {\n  const {",
  "export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({\n  isOpen,\n  onClose,\n  onSelectTest,\n}) => {\n  const { signInWithGoogle } = useAuth();\n  const {"
);

fs.writeFileSync(path, content, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const start = "const AppLayout = ({ children }: { children: React.ReactNode }) => {";
const end = "  return (";

const index1 = code.indexOf(start);
const index2 = code.indexOf(end, index1);

const newAppLayout = `const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return (`;

code = code.substring(0, index1) + newAppLayout + code.substring(index2 + end.length);
fs.writeFileSync('src/App.tsx', code);

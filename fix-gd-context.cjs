const fs = require('fs');
const path = 'src/contexts/GoogleDriveContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "  // Auto-refresh from Google Drive on startup / page refresh if token exists\n  // Also connect automatically when user signs in\n  useEffect(() => {\n    if (user && isDriveConnected() && !isConnected) {\n      setIsConnected(true);\n      refreshFiles();\n      refreshFromDrive();\n    }\n  }, [user, isConnected]);",
  "  // Auto-refresh from Google Drive on startup / page refresh if token exists\n  // Also connect automatically when user signs in\n  useEffect(() => {\n    if (isDriveConnected()) {\n      setIsConnected(true);\n      refreshFiles();\n      refreshFromDrive();\n    }\n  }, [user]); // re-run if user changes (e.g. signs in)"
);

fs.writeFileSync(path, content, 'utf8');

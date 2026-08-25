const fs = require('fs');
const path = 'src/contexts/GoogleDriveContext.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("useAuth")) {
  content = content.replace(
    "import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';",
    "import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';\nimport { useAuth } from './AuthContext';"
  );
}

content = content.replace(
  "export function GoogleDriveProvider({ children }: { children: React.ReactNode }) {",
  "export function GoogleDriveProvider({ children }: { children: React.ReactNode }) {\n  const { user } = useAuth();"
);

content = content.replace(
  "  // Auto-refresh from Google Drive on startup / page refresh if token exists\n  useEffect(() => {\n    if (isDriveConnected()) {\n      setIsConnected(true);\n      refreshFiles();\n      refreshFromDrive();\n    }\n  }, []);",
  "  // Auto-refresh from Google Drive on startup / page refresh if token exists\n  // Also connect automatically when user signs in\n  useEffect(() => {\n    if (user && isDriveConnected() && !isConnected) {\n      setIsConnected(true);\n      refreshFiles();\n      refreshFromDrive();\n    }\n  }, [user, isConnected]);\n\n  // Handle disconnect when user signs out\n  useEffect(() => {\n    if (!user && isConnected) {\n      setIsConnected(false);\n      setFiles([]);\n    }\n  }, [user, isConnected]);"
);

fs.writeFileSync(path, content, 'utf8');

const fs = require('fs');
const path = 'src/contexts/GoogleDriveContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "  const refreshFiles = useCallback(async () => {\n    if (!isDriveConnected()) return;\n    setIsSyncing(true);\n    try {\n      const fileList = await listDriveFiles();\n      setFiles(fileList);\n    } catch (e: any) {\n      console.warn('Failed to fetch Google Drive files list:', e);\n    } finally {\n      setIsSyncing(false);\n    }\n  }, []);",
  "  const refreshFiles = useCallback(async () => {\n    if (!isDriveConnected()) return;\n    try {\n      const fileList = await listDriveFiles();\n      setFiles(fileList);\n    } catch (e: any) {\n      console.warn('Failed to fetch Google Drive files list:', e);\n    }\n  }, []);"
);

fs.writeFileSync(path, content, 'utf8');

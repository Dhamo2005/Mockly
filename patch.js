import fs from 'fs';

let content = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

const helper = `
async function getTestFolderId(token: string, rootFolderId: string, testId: string, testTitle?: string, subfolder?: string): Promise<string> {
  const state = useStore.getState();
  const test = state.tests.find((t: any) => t.id === testId);
  
  const cleanTitle = (testTitle || test?.title || 'Untitled_Test').replace(/[/\\\\?%*:|"<>]/g, '_');
  const testFolderName = \`[Test] \${cleanTitle}_\${testId}\`;

  const path: string[] = [];
  if (test?.examCategory) path.push(test.examCategory);
  if (test?.exam?.tier) path.push(test.exam.tier);
  path.push(testFolderName);
  if (subfolder) path.push(subfolder);

  return getOrCreatePath(token, rootFolderId, path);
}
`;

content = content.replace('export async function exportTestToGoogleDrive', helper + '\nexport async function exportTestToGoogleDrive');

fs.writeFileSync('src/lib/googleDriveSync.ts', content);

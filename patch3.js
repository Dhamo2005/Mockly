import fs from 'fs';

let text = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

// Replace exportTestToGoogleDrive
const exportOld = `export async function exportTestToGoogleDrive(test: Test): Promise<string> {
  const token = await requestDriveAccessToken();
  const rootFolderId = await getOrCreateAppFolder(token);

  let folderId = rootFolderId;
  const path: string[] = [];
  if (test.examCategory) {
    path.push(test.examCategory);
    if (test.exam?.tier) {
      path.push(test.exam.tier);
    }
  }

  if (path.length > 0) {
    folderId = await getOrCreatePath(token, rootFolderId, path);
  }

  const cleanTitle = (test.title || 'Untitled_Test').replace(/[/\\\\?%*:|"<>]/g, '_');
  const filename = \`[Test] \${cleanTitle}_\${test.id}.json\`;
  const content = JSON.stringify(test, null, 2);

  const fileId = await uploadOrUpdateFile(token, folderId, filename, content);`;

const exportNew = `export async function exportTestToGoogleDrive(test: Test): Promise<string> {
  const token = await requestDriveAccessToken();
  const rootFolderId = await getOrCreateAppFolder(token);

  const folderId = await getTestFolderId(token, rootFolderId, test.id, test.title);

  const cleanTitle = (test.title || 'Untitled_Test').replace(/[/\\\\?%*:|"<>]/g, '_');
  const filename = \`[Test] \${cleanTitle}_\${test.id}.json\`;
  const content = JSON.stringify(test, null, 2);

  const fileId = await uploadOrUpdateFile(token, folderId, filename, content);`;

text = text.replace(exportOld, exportNew);

fs.writeFileSync('src/lib/googleDriveSync.ts', text);

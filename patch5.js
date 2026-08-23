import fs from 'fs';

let text = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

const liveOld = `export async function saveLiveTestSessionToDrive(
  testId: string,
  testTitle: string,
  sessionData: any
): Promise<string> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);`;

const liveNew = `export async function saveLiveTestSessionToDrive(
  testId: string,
  testTitle: string,
  sessionData: any
): Promise<string> {
  const token = await requestDriveAccessToken();
  const rootFolderId = await getOrCreateAppFolder(token);
  const folderId = await getTestFolderId(token, rootFolderId, testId, testTitle);`;

text = text.replace(liveOld, liveNew);

fs.writeFileSync('src/lib/googleDriveSync.ts', text);

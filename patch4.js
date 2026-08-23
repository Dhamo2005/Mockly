import fs from 'fs';

let text = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

const attemptOld = `export async function saveCompletedAttemptToDrive(
  attempt: TestAttempt,
  testTitle?: string
): Promise<string> {
  const token = await requestDriveAccessToken();
  const folderId = await getOrCreateAppFolder(token);`;

const attemptNew = `export async function saveCompletedAttemptToDrive(
  attempt: TestAttempt,
  testTitle?: string
): Promise<string> {
  const token = await requestDriveAccessToken();
  const rootFolderId = await getOrCreateAppFolder(token);
  const folderId = await getTestFolderId(token, rootFolderId, attempt.testId, testTitle, 'attempts');`;

text = text.replace(attemptOld, attemptNew);

fs.writeFileSync('src/lib/googleDriveSync.ts', text);

import fs from 'fs';

let text = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

const attemptDelOld = `export async function deleteAttemptFromGoogleDrive(attemptId: string): Promise<boolean> {
  if (!isDriveConnected()) return false;
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);

    // 1. Delete individual attempt file if exists
    const query = encodeURIComponent(
      \`name contains '\${escapeDriveQueryString(attemptId)}' and '\${folderId}' in parents and trashed = false\`
    );`;

const attemptDelNew = `export async function deleteAttemptFromGoogleDrive(attemptId: string): Promise<boolean> {
  if (!isDriveConnected()) return false;
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);

    // 1. Delete individual attempt file if exists
    const query = encodeURIComponent(
      \`name contains '\${escapeDriveQueryString(attemptId)}' and trashed = false\`
    );`;

text = text.replace(attemptDelOld, attemptDelNew);

fs.writeFileSync('src/lib/googleDriveSync.ts', text);

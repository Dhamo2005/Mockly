import fs from 'fs';

let text = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

const deleteOld = `export async function deleteTestFromGoogleDrive(testId: string): Promise<boolean> {
  if (!isDriveConnected()) return false;
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);

    // 1. Search and delete any test files associated with this testId
    const query = encodeURIComponent(
      \`name contains '\${escapeDriveQueryString(testId)}' and '\${folderId}' in parents and trashed = false\`
    );`;

const deleteNew = `export async function deleteTestFromGoogleDrive(testId: string): Promise<boolean> {
  if (!isDriveConnected()) return false;
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);

    // 1. Search and delete any test files OR folders associated with this testId
    // Since testId is a UUID, it is safe to search globally (without restricting to parent folder)
    const query = encodeURIComponent(
      \`name contains '\${escapeDriveQueryString(testId)}' and trashed = false\`
    );`;

text = text.replace(deleteOld, deleteNew);

fs.writeFileSync('src/lib/googleDriveSync.ts', text);

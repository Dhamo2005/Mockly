import fs from 'fs';

let text = fs.readFileSync('src/lib/googleDriveSync.ts', 'utf-8');

const getLiveOld = `export async function getLiveTestSessionFromDrive(
  testId: string,
  testTitle?: string
): Promise<any | null> {
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);`;

const getLiveNew = `export async function getLiveTestSessionFromDrive(
  testId: string,
  testTitle?: string
): Promise<any | null> {
  try {
    const token = await requestDriveAccessToken();
    const rootFolderId = await getOrCreateAppFolder(token);
    const folderId = await getTestFolderId(token, rootFolderId, testId, testTitle);`;

text = text.replace(getLiveOld, getLiveNew);

const delLiveOld = `export async function deleteLiveTestSessionFromDrive(
  testId: string,
  testTitle?: string
): Promise<boolean> {
  if (!isDriveConnected()) return false;
  try {
    const token = await requestDriveAccessToken();
    const folderId = await getOrCreateAppFolder(token);`;

const delLiveNew = `export async function deleteLiveTestSessionFromDrive(
  testId: string,
  testTitle?: string
): Promise<boolean> {
  if (!isDriveConnected()) return false;
  try {
    const token = await requestDriveAccessToken();
    const rootFolderId = await getOrCreateAppFolder(token);
    const folderId = await getTestFolderId(token, rootFolderId, testId, testTitle);`;

text = text.replace(delLiveOld, delLiveNew);

fs.writeFileSync('src/lib/googleDriveSync.ts', text);

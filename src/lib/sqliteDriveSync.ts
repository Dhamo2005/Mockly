import { useStore } from '../store/useStore';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

const FOLDER_NAME = 'Mockly';
const FILE_NAME = 'mock-test-database.sqlite';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const IDB_NAME = 'MocklySQLiteDB';
const IDB_STORE = 'sqlite_binary';

// Native IndexedDB helper for local SQLite binary caching
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSQLiteToIDB(binaryData: Uint8Array): Promise<void> {
  try {
    const idb = await openIDB();
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(binaryData, 'db_file');
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.error('Failed to save SQLite binary to IndexedDB:', e);
  }
}

async function loadSQLiteFromIDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIDB();
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const request = tx.objectStore(IDB_STORE).get('db_file');
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    console.error('Failed to load SQLite binary from IndexedDB:', e);
    return null;
  }
}

export async function initSQLiteEngine() {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: file => `https://unpkg.com/sql.js@1.14.1/dist/${file}`
  });
  return SQL;
}

function createTables() {
  if (!db) return;
  db.run(`
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      timeLimit INTEGER,
      themeColor TEXT,
      examCategory TEXT,
      positiveMarks REAL,
      negativeMarks REAL,
      sections TEXT,
      questions TEXT,
      settings TEXT,
      exam TEXT,
      scoring TEXT
    );
    CREATE TABLE IF NOT EXISTS test_sections (
      id TEXT PRIMARY KEY,
      testId TEXT,
      sectionName TEXT,
      sectionIndex INTEGER,
      timeLimit INTEGER
    );
    CREATE TABLE IF NOT EXISTS test_questions (
      id TEXT PRIMARY KEY,
      testId TEXT,
      sectionName TEXT,
      questionIndex INTEGER,
      textEn TEXT,
      textHi TEXT,
      explanationEn TEXT,
      explanationHi TEXT,
      correctOptionId TEXT,
      positiveMarks REAL,
      negativeMarks REAL
    );
    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      questionId TEXT,
      optionKey TEXT,
      textEn TEXT,
      textHi TEXT,
      optionIndex INTEGER
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      testId TEXT,
      startTime INTEGER,
      endTime INTEGER,
      completed INTEGER,
      score REAL,
      totalQuestions INTEGER,
      correctAnswers INTEGER,
      incorrectAnswers INTEGER,
      answers TEXT,
      statuses TEXT,
      timeSpent TEXT
    );
    CREATE TABLE IF NOT EXISTS attempt_answers (
      id TEXT PRIMARY KEY,
      attemptId TEXT,
      questionId TEXT,
      selectedOptionId TEXT,
      isCorrect INTEGER,
      timeSpent INTEGER
    );
    CREATE TABLE IF NOT EXISTS active_test_sessions (
      testId TEXT PRIMARY KEY,
      currentQuestionIndex INTEGER,
      currentSectionIndex INTEGER,
      sectionTimeLeft TEXT,
      answers TEXT,
      statuses TEXT,
      timeLeft INTEGER,
      timeSpent TEXT,
      isPaused INTEGER,
      reportedQuestions TEXT,
      lastUpdated INTEGER
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      questionId TEXT PRIMARY KEY,
      createdAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  try { db.run(`ALTER TABLE tests ADD COLUMN positiveMarks REAL`); } catch (e) {}
  try { db.run(`ALTER TABLE tests ADD COLUMN negativeMarks REAL`); } catch (e) {}
  try { db.run(`ALTER TABLE tests ADD COLUMN settings TEXT`); } catch (e) {}
  try { db.run(`ALTER TABLE tests ADD COLUMN exam TEXT`); } catch (e) {}
  try { db.run(`ALTER TABLE tests ADD COLUMN scoring TEXT`); } catch (e) {}
  try { db.run(`ALTER TABLE active_test_sessions ADD COLUMN currentSectionIndex INTEGER`); } catch (e) {}
  try { db.run(`ALTER TABLE active_test_sessions ADD COLUMN sectionTimeLeft TEXT`); } catch (e) {}
}

export function loadStateFromDB() {
  if (!db) return null;

  const state: any = {
    language: 'en',
    tests: [],
    attempts: [],
    activeTestSessions: {},
    bookmarks: {}
  };

  try {
    // 1. Language
    const langRes = db.exec(`SELECT value FROM app_state WHERE key = 'language'`);
    if (langRes.length > 0 && langRes[0].values.length > 0) {
      state.language = langRes[0].values[0][0];
    }

    // 2. Tests
    const testsRes = db.exec(`SELECT * FROM tests`);
    if (testsRes.length > 0) {
      const cols = testsRes[0].columns;
      state.tests = testsRes[0].values.map((row: any[]) => {
        const t: any = {};
        cols.forEach((col, i) => {
          if (['sections', 'questions', 'settings', 'exam', 'scoring'].includes(col)) {
            t[col] = row[i] ? JSON.parse(row[i]) : (col === 'sections' || col === 'questions' ? [] : undefined);
          } else {
            t[col] = row[i];
          }
        });
        return t;
      });
    }

    // 3. Attempts
    const attemptsRes = db.exec(`SELECT * FROM attempts`);
    if (attemptsRes.length > 0) {
      const cols = attemptsRes[0].columns;
      state.attempts = attemptsRes[0].values.map((row: any[]) => {
        const a: any = {};
        cols.forEach((col, i) => {
          if (['answers', 'statuses', 'timeSpent'].includes(col)) {
            a[col] = row[i] ? JSON.parse(row[i]) : {};
          } else if (col === 'completed') {
            a[col] = row[i] === 1;
          } else {
            a[col] = row[i];
          }
        });
        return a;
      });
    }

    // 4. Active Test Sessions
    const sessionsRes = db.exec(`SELECT * FROM active_test_sessions`);
    if (sessionsRes.length > 0) {
      const cols = sessionsRes[0].columns;
      sessionsRes[0].values.forEach((row: any[]) => {
        const sess: any = {};
        cols.forEach((col, i) => {
          if (['answers', 'statuses', 'timeSpent', 'reportedQuestions', 'sectionTimeLeft'].includes(col)) {
            sess[col] = row[i] ? JSON.parse(row[i]) : {};
          } else if (col === 'isPaused') {
            sess[col] = row[i] === 1;
          } else {
            sess[col] = row[i];
          }
        });
        if (sess.testId) {
          state.activeTestSessions[sess.testId] = sess;
        }
      });
    }

    // 5. Bookmarks
    const bookmarksRes = db.exec(`SELECT * FROM bookmarks`);
    if (bookmarksRes.length > 0) {
      bookmarksRes[0].values.forEach((row: any[]) => {
        const qId = row[0];
        if (qId) state.bookmarks[qId] = true;
      });
    }
  } catch (err) {
    console.error('Error loading state from SQLite database:', err);
  }

  return state;
}

export function saveStateToDB(state: any) {
  if (!db) return;

  try {
    db.run(`
      DELETE FROM tests;
      DELETE FROM test_sections;
      DELETE FROM test_questions;
      DELETE FROM question_options;
      DELETE FROM attempts;
      DELETE FROM attempt_answers;
      DELETE FROM active_test_sessions;
      DELETE FROM bookmarks;
      DELETE FROM app_state;
    `);

    // 1. Language
    db.run(`INSERT INTO app_state (key, value) VALUES (?, ?)`, ['language', state.language || 'en']);

    // 2. Tests & Normalized Sections, Questions, Options
    if (state.tests && state.tests.length > 0) {
      const stmtTest = db.prepare(`INSERT INTO tests (id, title, description, timeLimit, themeColor, examCategory, positiveMarks, negativeMarks, sections, questions, settings, exam, scoring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const stmtSec = db.prepare(`INSERT INTO test_sections (id, testId, sectionName, sectionIndex, timeLimit) VALUES (?, ?, ?, ?, ?)`);
      const stmtQ = db.prepare(`INSERT INTO test_questions (id, testId, sectionName, questionIndex, textEn, textHi, explanationEn, explanationHi, correctOptionId, positiveMarks, negativeMarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const stmtOpt = db.prepare(`INSERT INTO question_options (id, questionId, optionKey, textEn, textHi, optionIndex) VALUES (?, ?, ?, ?, ?, ?)`);

      for (const t of state.tests) {
        stmtTest.run([
          t.id,
          t.title || '',
          t.description || '',
          t.timeLimit || 0,
          t.themeColor || null,
          t.examCategory || null,
          t.positiveMarks ?? null,
          t.negativeMarks ?? null,
          JSON.stringify(t.sections || []),
          JSON.stringify(t.questions || []),
          JSON.stringify(t.settings || {}),
          JSON.stringify(t.exam || {}),
          JSON.stringify(t.scoring || {})
        ]);

        // Insert Sections
        if (Array.isArray(t.sections)) {
          t.sections.forEach((sec: any, sIdx: number) => {
            stmtSec.run([
              `${t.id}_sec_${sIdx}`,
              t.id,
              sec.name || '',
              sIdx,
              sec.timeLimit || 0
            ]);
          });
        }

        // Insert Questions & Options
        if (Array.isArray(t.questions)) {
          t.questions.forEach((q: any, qIdx: number) => {
            const textEn = typeof q.text === 'object' ? (q.text?.en || '') : String(q.text || '');
            const textHi = typeof q.text === 'object' ? (q.text?.hi || '') : '';
            const expEn = typeof q.explanation === 'object' ? (q.explanation?.en || '') : String(q.explanation || '');
            const expHi = typeof q.explanation === 'object' ? (q.explanation?.hi || '') : '';

            stmtQ.run([
              q.id,
              t.id,
              q.section || '',
              qIdx,
              textEn,
              textHi,
              expEn,
              expHi,
              q.correctOptionId || '',
              t.positiveMarks ?? 1.0,
              t.negativeMarks ?? 0.25
            ]);

            if (Array.isArray(q.options)) {
              q.options.forEach((opt: any, optIdx: number) => {
                const optTextEn = typeof opt.text === 'object' ? (opt.text?.en || '') : String(opt.text || '');
                const optTextHi = typeof opt.text === 'object' ? (opt.text?.hi || '') : '';
                stmtOpt.run([
                  `${q.id}_opt_${opt.id || optIdx}`,
                  q.id,
                  opt.id || String(optIdx),
                  optTextEn,
                  optTextHi,
                  optIdx
                ]);
              });
            }
          });
        }
      }
      stmtTest.free();
      stmtSec.free();
      stmtQ.free();
      stmtOpt.free();
    }

    // 3. Attempts & Answers
    if (state.attempts && state.attempts.length > 0) {
      const stmtAtt = db.prepare(`INSERT INTO attempts (id, testId, startTime, endTime, completed, score, totalQuestions, correctAnswers, incorrectAnswers, answers, statuses, timeSpent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const stmtAns = db.prepare(`INSERT INTO attempt_answers (id, attemptId, questionId, selectedOptionId, isCorrect, timeSpent) VALUES (?, ?, ?, ?, ?, ?)`);

      for (const a of state.attempts) {
        stmtAtt.run([
          a.id,
          a.testId,
          a.startTime,
          a.endTime || null,
          a.completed ? 1 : 0,
          a.score !== undefined ? a.score : null,
          a.totalQuestions || 0,
          a.correctAnswers || 0,
          a.incorrectAnswers || 0,
          JSON.stringify(a.answers || {}),
          JSON.stringify(a.statuses || {}),
          JSON.stringify(a.timeSpent || {})
        ]);

        if (a.answers) {
          for (const [qId, selectedOptId] of Object.entries<any>(a.answers)) {
            stmtAns.run([
              `${a.id}_ans_${qId}`,
              a.id,
              qId,
              String(selectedOptId || ''),
              a.statuses?.[qId] === 'correct' ? 1 : 0,
              a.timeSpent?.[qId] || 0
            ]);
          }
        }
      }
      stmtAtt.free();
      stmtAns.free();
    }

    // 4. Active Test Sessions
    if (state.activeTestSessions) {
      const stmt = db.prepare(`INSERT INTO active_test_sessions (testId, currentQuestionIndex, currentSectionIndex, sectionTimeLeft, answers, statuses, timeLeft, timeSpent, isPaused, reportedQuestions, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const [tId, sess] of Object.entries<any>(state.activeTestSessions)) {
        if (!sess) continue;
        stmt.run([
          tId,
          sess.currentQuestionIndex || 0,
          sess.currentSectionIndex || 0,
          JSON.stringify(sess.sectionTimeLeft || {}),
          JSON.stringify(sess.answers || {}),
          JSON.stringify(sess.statuses || {}),
          sess.timeLeft || 0,
          JSON.stringify(sess.timeSpent || {}),
          sess.isPaused ? 1 : 0,
          JSON.stringify(sess.reportedQuestions || {}),
          sess.lastUpdated || Date.now()
        ]);
      }
      stmt.free();
    }

    // 5. Bookmarks
    if (state.bookmarks) {
      const stmt = db.prepare(`INSERT INTO bookmarks (questionId, createdAt) VALUES (?, ?)`);
      for (const [qId, isBookmarked] of Object.entries<any>(state.bookmarks)) {
        if (isBookmarked) {
          stmt.run([qId, Date.now()]);
        }
      }
      stmt.free();
    }
  } catch (err) {
    console.error('Error saving state to SQLite database:', err);
  }
}

export async function resetLocalSQLiteDatabase() {
  if (db) {
    try {
      db.close();
    } catch (e) {
      // ignore
    }
    db = null;
  }
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
  try {
    indexedDB.deleteDatabase(IDB_NAME);
  } catch (e) {
    console.error('Failed to delete IDB database:', e);
  }
  useStore.getState().clearAllData();
}

// Initial local DB loader (runs immediately on app launch)
export async function initLocalSQLiteDatabase() {
  try {
    await initSQLiteEngine();
  } catch (e) {
    console.error('Failed to initialize local SQLite engine:', e);
  }
}

async function getOrCreateFolder(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`);
  let res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  let data = await res.json();
  if (data.files && data.files.length > 0) return data.files[0].id;
  
  const metadata = { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder', parents: ['root'] };
  res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  });
  if (!res.ok) return null;
  data = await res.json();
  return data.id;
}

async function findFileId(token: string, folderId: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

export async function loadSQLiteFromDrive(token: string | null) {
  try {
    await initSQLiteEngine();
    
    // 1. Immediately hydrate state from local IndexedDB cache if available
    const cachedBinary = await loadSQLiteFromIDB();
    if (cachedBinary) {
      try {
        db = new SQL!.Database(cachedBinary);
        createTables();
        const state = loadStateFromDB();
        if (state && (state.tests?.length > 0 || state.attempts?.length > 0)) {
          useStore.setState(state);
        }
      } catch (e) {
        console.warn('Failed to parse cached local SQLite DB:', e);
      }
    }

    if (!db) {
      db = new SQL!.Database();
      createTables();
    }

    // 2. If token is present, try loading latest file from Google Drive
    if (token) {
      try {
        const folderId = await getOrCreateFolder(token);
        if (folderId) {
          const fileId = await findFileId(token, folderId);
          if (fileId) {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              db = new SQL!.Database(new Uint8Array(buffer));
              createTables();
              const state = loadStateFromDB();
              if (state) {
                useStore.setState(state);
                const data = db.export();
                await saveSQLiteToIDB(data);
              }
              useStore.getState().setIsInitialized(true);
              return;
            }
          }
        }
      } catch (driveErr) {
        console.warn('Google Drive load skipped, using local database:', driveErr);
      }
    }

    // 3. Fallback to default sample test if no tests exist in store
    if (useStore.getState().tests.length === 0) {
      try {
        const res = await fetch('/ssc-cgl-18sep2025.json');
        if (res.ok) {
          const defaultTests = await res.json();
          if (Array.isArray(defaultTests)) {
            useStore.getState().importTests(defaultTests);
            if (token) {
              await saveSQLiteToDrive(token, useStore.getState(), true);
            } else {
              saveStateToDB(useStore.getState());
              const data = db.export();
              await saveSQLiteToIDB(data);
            }
          }
        }
      } catch (e) {
        console.warn('Could not load sample test JSON:', e);
      }
    }
  } catch (e) {
    console.warn('Failed to load SQLite engine:', e);
  } finally {
    useStore.getState().setIsInitialized(true);
  }
}

let syncTimeout: any;
let isSyncing = false;
let needsSync = false;

export async function saveSQLiteToDrive(token: string | null, state: any, immediate = false) {
  try {
    if (!SQL) await initSQLiteEngine();
    if (!db) {
      db = new SQL!.Database();
      createTables();
    }
    
    // 1. Always update SQLite DB in memory and persist binary to IndexedDB locally
    saveStateToDB(state);
    const binaryData = db.export();
    await saveSQLiteToIDB(binaryData);

    // 2. If Google token is provided, sync SQLite file to Google Drive
    if (!token) return;
    
    if (isSyncing) {
      needsSync = true;
      return;
    }

    if (syncTimeout) clearTimeout(syncTimeout);

    const performSync = async () => {
      isSyncing = true;
      needsSync = false;
      try {
        const latestBinaryData = db!.export();
        const file = new Blob([latestBinaryData], { type: 'application/x-sqlite3' });
        const folderId = await getOrCreateFolder(token);
        if (!folderId) {
          isSyncing = false;
          return;
        }
        let fileId = await findFileId(token, folderId);
        
        if (fileId) {
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME })], { type: 'application/json' }));
          form.append('file', file);
          await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
            keepalive: immediate
          });
        } else {
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME, parents: [folderId] })], { type: 'application/json' }));
          form.append('file', file);
          await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
            keepalive: immediate
          });
        }
      } catch (e) {
        console.warn('Google Drive sync skipped (network/offline):', e);
      } finally {
        isSyncing = false;
        if (needsSync) {
          saveSQLiteToDrive(token, useStore.getState(), false);
        }
      }
    };

    if (immediate) {
      performSync();
    } else {
      syncTimeout = setTimeout(performSync, 1500);
    }
  } catch (e) {
    console.warn('Failed to save state to local SQLite database:', e);
  }
}

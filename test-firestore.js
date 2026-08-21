import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import config from './firebase-applet-config.json' assert { type: "json" };

const app = initializeApp(config);
const db = config.firestoreDatabaseId === '(default)' ? getFirestore(app) : getFirestore(app, config.firestoreDatabaseId);

console.log("Setup complete");

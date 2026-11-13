// tests/testFirebaseAuth.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8');

function getVal(key) {
  const match = env.match(new RegExp(`${key}=([^\r\n]+)`));
  return match ? match[1].trim() : '';
}

const firebaseConfig = {
  apiKey: getVal('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getVal('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getVal('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getVal('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getVal('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getVal('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

console.log('Testing Firebase App initialization with Project ID:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testFirebase() {
  console.log('Firebase initialized successfully!');
  console.log('Auth current user:', auth.currentUser);
}

testFirebase().catch(console.error);

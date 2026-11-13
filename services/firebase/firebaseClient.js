/**
 * services/firebase/firebaseClient.js
 * 
 * Firebase Client Initialization for User Authentication.
 * Works seamlessly across Web, iOS, and Android (Expo).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app = null;
let auth = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 5 && !firebaseConfig.apiKey.includes('your_')) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (err) {
    console.warn('[Firebase] Client initialization notice:', err.message);
  }
}

export { app, auth };
export default app;

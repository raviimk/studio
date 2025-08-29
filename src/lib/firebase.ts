
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration is loaded from environment variables
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let db: Database;

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL;

if (typeof window !== 'undefined' && isConfigValid) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getDatabase(app);
}

/**
 * Checks if the Firebase database instance is available.
 * @returns {boolean} True if Firebase is connected, false otherwise.
 */
function isFirebaseConnected(): boolean {
  return !!db && isConfigValid;
}

export { app, db, isFirebaseConnected };

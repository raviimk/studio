
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Hardcoded Firebase configuration object provided by the user.
export const firebaseConfig = {
  projectId: "gem-tracker-b71hl",
  appId: "1:607236477290:web:939188363a59434aef1513",
  storageBucket: "gem-tracker-b71hl.firebasestorage.app",
  apiKey: "AIzaSyBckbnkKF7I_uqEZEgwvdYQ968F-pItmmE",
  authDomain: "gem-tracker-b71hl.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "607236477290",
  databaseURL: "https://gem-tracker-b71hl-default-rtdb.firebaseio.com"
};

let app: FirebaseApp;
let db: Database;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    try {
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      db = getDatabase(app);
    } catch (e) {
      console.error("Failed to initialize Firebase:", e);
      // @ts-ignore
      app = null;
      // @ts-ignore
      db = null;
    }
  } else {
    app = getApp();
    db = getDatabase(app);
  }
}

/**
 * Checks if the Firebase database instance is available.
 * @returns {boolean} True if Firebase is connected, false otherwise.
 */
function isFirebaseConnected(): boolean {
  return !!db;
}

export { app, db, isFirebaseConnected };

    
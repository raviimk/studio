import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, Database } from 'firebase/database';
import { FIREBASE_CONFIG_KEY } from './constants';

let app: FirebaseApp | null = null;
let db: Database | null = null;
let firebaseConfig: any = null;

if (typeof window !== 'undefined') {
    const configStr = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (configStr) {
        try {
            firebaseConfig = JSON.parse(configStr);
            // The Firebase Realtime Database SDK can derive the database URL from the project ID.
            // But if a user provides a full URL with a path, it fails.
            // This ensures we only use the root domain if databaseURL is provided.
            if (firebaseConfig.databaseURL) {
                const url = new URL(firebaseConfig.databaseURL);
                firebaseConfig.databaseURL = `${url.protocol}//${url.hostname}`;
            }
        } catch (e) {
            console.error("Failed to parse Firebase config from localStorage", e);
            firebaseConfig = null;
        }
    }
}

if (firebaseConfig && !getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
    } catch (e) {
        console.error("Failed to initialize Firebase:", e);
        app = null;
        db = null;
    }
} else if (getApps().length > 0) {
    app = getApp();
    db = getDatabase(app);
}

function isFirebaseConnected() {
    return !!db;
}

export { app, db, isFirebaseConnected, firebaseConfig };

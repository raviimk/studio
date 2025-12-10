'use client';

import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { app } from './config';

export function useFirestore(): Firestore {
  return getFirestore(app);
}

export function useAuth(): Auth {
  return getAuth(app);
}

export function useFirebaseApp(): FirebaseApp {
  return app;
}

export * from './provider';
export * from './use-collection';
export * from './use-doc';


'use client';

import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { app } from './config';

export function useFirestore() {
  return getFirestore(app);
}

export function useAuth() {
  return getAuth(app);
}

export * from './use-collection';
export * from './use-doc';
export * from './client-provider';

    
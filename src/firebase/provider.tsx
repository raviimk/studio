'use client';
import { ReactNode, createContext, useContext } from 'react';
import { Auth } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { useAuth, useFirebaseApp, useFirestore } from '.';

interface FirebaseContextValue {
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const app = useFirebaseApp();
    const firestore = useFirestore();
    const auth = useAuth();
    
    return (
        <FirebaseContext.Provider value={{ app, firestore, auth }}>
            {children}
        </FirebaseContext.Provider>
    )
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

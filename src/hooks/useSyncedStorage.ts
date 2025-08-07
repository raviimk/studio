
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useLocalStorage } from './useLocalStorage';

// This is the primary hook for data storage.
// It automatically handles synchronization with Firestore if connected,
// otherwise it falls back to using simple localStorage.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [localValue, setLocalValue] = useLocalStorage<T>(key, initialValue);
  const [syncedValue, setSyncedValue] = useState<T>(localValue);
  
  const firebaseConnected = isFirebaseConnected();
  const COLLECTION_NAME = 'app_data';

  useEffect(() => {
    if (!firebaseConnected || !key) {
      // If not using Firebase, the source of truth is always localValue
      setSyncedValue(localValue);
      return;
    }

    const docRef = doc(db, COLLECTION_NAME, key);

    const syncWithFirestore = async () => {
      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Firestore has data, it is the source of truth.
          const firestoreData = docSnap.data()?.value as T;
          if (firestoreData !== undefined && firestoreData !== null) {
            setSyncedValue(firestoreData);
            // Overwrite local storage to ensure consistency
            if(JSON.stringify(firestoreData) !== JSON.stringify(localValue)) {
                setLocalValue(firestoreData);
            }
          }
        } else {
          // Firestore has no data, local storage is the source of truth (for migration).
          // `localValue` is already loaded by `useLocalStorage` hook.
          console.log(`Document '${key}' not found in Firestore. Migrating local data...`);
          await setDoc(docRef, { value: localValue });
          setSyncedValue(localValue);
        }
      } catch(error) {
        console.error("Error during initial sync with Firestore:", error);
      }
    };
    
    syncWithFirestore();

    // Set up a real-time listener for subsequent updates from other clients.
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            const firestoreData = snapshot.data()?.value as T;
            if (firestoreData !== undefined && firestoreData !== null) {
                // Update state only if it's different to prevent loops
                if (JSON.stringify(firestoreData) !== JSON.stringify(syncedValue)) {
                    setSyncedValue(firestoreData);
                    setLocalValue(firestoreData);
                }
            }
        }
    }, (error) => {
        console.error(`Error listening to Firestore document '${key}':`, error);
    });

    return () => unsubscribe();
  }, [firebaseConnected, key]); // Removed localValue, setLocalValue, syncedValue from deps to prevent loops

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(syncedValue) : value;
      
      // Update state immediately for a responsive UI
      setSyncedValue(valueToStore);
      
      if (firebaseConnected && key) {
        const docRef = doc(db, COLLECTION_NAME, key);
        setDoc(docRef, { value: valueToStore }).catch(error => {
            console.error(`Error writing to Firestore document '${key}':`, error);
        });
      } else {
        // Fallback to only updating local storage if not connected
        setLocalValue(valueToStore);
      }
    },
    [firebaseConnected, key, syncedValue, setLocalValue]
  );

  return [syncedValue, setValue];
}

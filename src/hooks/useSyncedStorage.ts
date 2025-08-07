
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useLocalStorage } from './useLocalStorage';

// This is the primary hook for data storage.
// It automatically handles synchronization with Firestore if connected,
// otherwise it falls back to using simple localStorage.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Step 1: `useLocalStorage` reads from localStorage and initializes state.
  // It returns the value from localStorage if it exists, otherwise `initialValue`.
  const [localValue, setLocalValue] = useLocalStorage<T>(key, initialValue);
  const [syncedValue, setSyncedValue] = useState<T>(initialValue);
  
  const firebaseConnected = isFirebaseConnected();
  const COLLECTION_NAME = 'app_data';

  useEffect(() => {
    // If not using Firebase, the source of truth is always localValue
    if (!firebaseConnected || !key) {
      setSyncedValue(localValue);
      return;
    }

    const docRef = doc(db, COLLECTION_NAME, key);

    const syncWithFirestore = async () => {
      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Step 2a: Firestore has data. It is the source of truth.
          const firestoreData = docSnap.data()?.value as T;
          if (firestoreData !== undefined) {
             setSyncedValue(firestoreData);
             // Overwrite local storage to ensure consistency on this device.
             if(JSON.stringify(firestoreData) !== JSON.stringify(localValue)) {
                setLocalValue(firestoreData);
            }
          }
        } else {
          // Step 2b: Firestore has no data. `localValue` (from localStorage) is the source of truth.
          // This is the one-time migration path.
          console.log(`Document '${key}' not found in Firestore. Migrating local data...`);
          await setDoc(docRef, { value: localValue });
          setSyncedValue(localValue);
        }
      } catch(error) {
        console.error(`Error during initial sync for key '${key}':`, error);
        // On error, fall back to local value
        setSyncedValue(localValue);
      }
    };
    
    syncWithFirestore();

    // Set up a real-time listener for subsequent updates from other clients.
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            const firestoreData = snapshot.data()?.value as T;
            if (firestoreData !== undefined) {
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
  // We only want this effect to run once on mount to perform the initial sync/migration.
  // Subsequent updates are handled by the onSnapshot listener and the setValue callback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseConnected, key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Allow value to be a function, like in useState
      const valueToStore = value instanceof Function ? value(syncedValue) : value;
      
      // Update state immediately for a responsive UI
      setSyncedValue(valueToStore);
      
      if (firebaseConnected && key) {
        // If connected, write the new value to Firestore.
        const docRef = doc(db, COLLECTION_NAME, key);
        setDoc(docRef, { value: valueToStore }).catch(error => {
            console.error(`Error writing to Firestore document '${key}':`, error);
            // If Firestore write fails, we should probably revert the optimistic update
            // or handle it more gracefully, but for now, we log the error.
        });
      } else {
        // Fallback to only updating local storage if not connected
        setLocalValue(valueToStore);
      }
    },
    [firebaseConnected, key, syncedValue, setLocalValue]
  );

  return [firebaseConnected ? syncedValue : localValue, setValue];
}

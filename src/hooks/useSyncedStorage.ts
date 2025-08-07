
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, get, DatabaseReference } from 'firebase/database';
import { useLocalStorage } from './useLocalStorage';

// This is the primary hook for data storage.
// It handles synchronization with Firebase Realtime Database.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [localValue, setLocalValue] = useLocalStorage<T>(key, initialValue);
  const [syncedValue, setSyncedValue] = useState<T>(initialValue);
  
  const DATA_ROOT = 'data';

  useEffect(() => {
    // We need to ensure we don't proceed if the key is not valid.
    if (!key) {
      return;
    }
    
    console.log(`[useSyncedStorage] Initializing for key: ${key}`);

    const dbRef: DatabaseReference = ref(db, `${DATA_ROOT}/${key}`);

    const syncWithFirebase = async () => {
      try {
        console.log(`[useSyncedStorage] Checking Firebase for key: ${key}`);
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
          console.log(`[useSyncedStorage] Data found in Firebase for key: ${key}. Syncing to local state.`);
          const firebaseData = snapshot.val() as T;
          if (firebaseData !== null && firebaseData !== undefined) {
            setSyncedValue(firebaseData);
            // Ensure localStorage is in sync with Firebase.
            if (JSON.stringify(firebaseData) !== JSON.stringify(localValue)) {
                setLocalValue(firebaseData);
            }
          }
        } else {
          // Data does not exist in Firebase. The current localValue (from localStorage) is the source of truth.
          // This serves as the one-time migration.
          console.log(`[useSyncedStorage] No data in Firebase for key: ${key}. Migrating local data.`);
          await set(dbRef, localValue);
          setSyncedValue(localValue);
        }
      } catch(error) {
        console.error(`[useSyncedStorage] Error during initial sync for key '${key}':`, error);
        // On error, fall back to local value.
        setSyncedValue(localValue);
      }
    };
    
    syncWithFirebase();

    // Set up a real-time listener for subsequent updates from other clients.
    const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            const firebaseData = snapshot.val() as T;
             if (firebaseData !== null && firebaseData !== undefined) {
                // Update state only if it's different to prevent loops
                 if (JSON.stringify(firebaseData) !== JSON.stringify(syncedValue)) {
                    console.log(`[useSyncedStorage] Remote change detected for key: ${key}. Updating state.`);
                    setSyncedValue(firebaseData);
                    setLocalValue(firebaseData);
                }
            }
        }
    }, (error) => {
        console.error(`[useSyncedStorage] Error listening to Firebase Realtime DB for key '${key}':`, error);
    });

    // Cleanup the listener when the component unmounts or the key changes.
    return () => unsubscribe();
    // This dependency array is CRITICAL. It ensures this effect re-runs if the key changes.
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(syncedValue) : value;
      
      // Update state immediately for a responsive UI
      setSyncedValue(valueToStore);
      
      // Write the new value to Realtime DB.
      if (key) {
        const dbRef = ref(db, `${DATA_ROOT}/${key}`);
        set(dbRef, valueToStore).catch(error => {
            console.error(`[useSyncedStorage] Error writing to Realtime DB for key '${key}':`, error);
        });
      }
    },
    [key, syncedValue]
  );

  return [syncedValue, setValue];
}

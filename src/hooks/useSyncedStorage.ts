
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { ref, onValue, set, get, DatabaseReference } from 'firebase/database';
import { useLocalStorage } from './useLocalStorage';

// This is the primary hook for data storage.
// It automatically handles synchronization with Firebase Realtime Database if connected,
// otherwise it falls back to using simple localStorage.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [localValue, setLocalValue] = useLocalStorage<T>(key, initialValue);
  const [syncedValue, setSyncedValue] = useState<T>(initialValue);
  
  const firebaseConnected = isFirebaseConnected();
  const DATA_ROOT = 'data';

  useEffect(() => {
    // If not using Firebase, the source of truth is always localValue
    if (!firebaseConnected || !key) {
      setSyncedValue(localValue);
      return;
    }

    const dbRef: DatabaseReference = ref(db, `${DATA_ROOT}/${key}`);

    const syncWithFirebase = async () => {
      try {
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
          // Data exists in Firebase, it is the source of truth.
          const firebaseData = snapshot.val() as T;
          if (firebaseData !== null && firebaseData !== undefined) {
            setSyncedValue(firebaseData);
            // Overwrite local storage to ensure consistency.
            if (JSON.stringify(firebaseData) !== JSON.stringify(localValue)) {
              setLocalValue(firebaseData);
            }
          }
        } else {
          // Data does not exist in Firebase. Local data is the source of truth (one-time migration).
          console.log(`Data for '${key}' not found in Realtime DB. Migrating local data...`);
          await set(dbRef, localValue);
          setSyncedValue(localValue);
        }
      } catch(error) {
        console.error(`Error during initial sync for key '${key}':`, error);
        // On error, fall back to local value
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
                    setSyncedValue(firebaseData);
                    setLocalValue(firebaseData);
                }
            }
        }
    }, (error) => {
        console.error(`Error listening to Firebase Realtime DB for key '${key}':`, error);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseConnected, key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(syncedValue) : value;
      
      // Update state immediately for a responsive UI
      setSyncedValue(valueToStore);
      
      if (firebaseConnected && key) {
        // If connected, write the new value to Realtime DB.
        const dbRef = ref(db, `${DATA_ROOT}/${key}`);
        set(dbRef, valueToStore).catch(error => {
            console.error(`Error writing to Realtime DB for key '${key}':`, error);
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

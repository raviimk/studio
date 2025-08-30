
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { ref, onValue, set, get, DatabaseReference } from 'firebase/database';

// This is the primary hook for data storage.
// It handles synchronization with Firebase Realtime Database.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const DATA_ROOT = 'data';

  useEffect(() => {
    if (!key || !isFirebaseConnected()) {
      // Fallback to initialValue if firebase is not configured or key is missing
      setValue(initialValue);
      return;
    }

    const dbRef: DatabaseReference = ref(db, `${DATA_ROOT}/${key}`);

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const firebaseData = snapshot.val() as T;
        if (firebaseData !== null && firebaseData !== undefined) {
           setValue(firebaseData);
        }
      } else {
        // If no data in Firebase, initialize it with the provided initialValue
        set(dbRef, initialValue);
        setValue(initialValue);
      }
    }, (error) => {
      console.error(`[useSyncedStorage] Error listening to Firebase for key '${key}':`, error);
      // On error, you might want to fallback to a default or show an error state.
      // For now, we'll stick with the initialValue.
      setValue(initialValue);
    });

    return () => unsubscribe();
  }, [key, initialValue]);

  const updateValue = useCallback(
    (newValue: T | ((val: T) => T)) => {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      
      if (isFirebaseConnected() && key) {
        const dbRef = ref(db, `${DATA_ROOT}/${key}`);
        set(dbRef, valueToStore).catch(error => {
          console.error(`[useSyncedStorage] Error writing to Firebase for key '${key}':`, error);
        });
      }
      // The local state will be updated automatically by the onValue listener,
      // so we don't need a `setValue(valueToStore)` here, which prevents a double-render.
    },
    [key, value]
  );

  return [value, updateValue];
}

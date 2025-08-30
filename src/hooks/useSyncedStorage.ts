
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { ref, onValue, set, get, DatabaseReference } from 'firebase/database';

export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const dbRef = useRef<DatabaseReference | null>(null);

  useEffect(() => {
    if (!key || !isFirebaseConnected()) {
      setValue(initialValue);
      return;
    }

    dbRef.current = ref(db, `data/${key}`);

    // First, try to get the initial data once.
    get(dbRef.current).then((snapshot) => {
      if (snapshot.exists()) {
        setValue(snapshot.val());
      } else {
        // If no data exists, set the initial value in Firebase.
        set(dbRef.current!, initialValue);
        setValue(initialValue);
      }
    }).catch(error => {
      console.error(`[useSyncedStorage] Initial fetch for key '${key}' failed:`, error);
      setValue(initialValue);
    });

    // Then, set up the real-time listener for subsequent updates.
    const unsubscribe = onValue(dbRef.current, (snapshot) => {
      if (snapshot.exists()) {
        setValue(snapshot.val());
      }
    }, (error) => {
      console.error(`[useSyncedStorage] Error listening to Firebase for key '${key}':`, error);
    });

    // Cleanup listener on component unmount.
    return () => unsubscribe();
  }, [key]); // Effect runs only when the key changes.

  const updateValue = useCallback((newValue: T | ((val: T) => T)) => {
    const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
    
    // Optimistically update local state to make the UI feel instant.
    setValue(valueToStore);

    if (isFirebaseConnected() && dbRef.current) {
      set(dbRef.current, valueToStore).catch(error => {
        console.error(`[useSyncedStorage] Error writing to Firebase for key '${key}':`, error);
        // Optionally, revert the optimistic update here if the write fails.
      });
    }
  }, [key, value]);

  return [value, updateValue];
}

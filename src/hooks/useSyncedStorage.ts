
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConnected, firebaseConfig } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { useLocalStorage } from './useLocalStorage';

// This is the primary hook for data storage.
// It automatically handles synchronization with Firebase if connected,
// otherwise it falls back to using simple localStorage.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [localValue, setLocalValue] = useLocalStorage<T>(`local_${key}`, initialValue);
  const [syncedValue, setSyncedValue] = useState<T>(initialValue);

  const connectionCode = firebaseConfig?.connectionCode;
  const firebaseConnected = isFirebaseConnected() && connectionCode;
  
  // Path in Firebase Realtime Database
  const dbPath = connectionCode ? `rooms/${connectionCode}/${key}` : '';

  useEffect(() => {
    if (firebaseConnected && dbPath) {
      const dbRef = ref(db, dbPath);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
          setSyncedValue(data);
          // Keep local storage in sync with Firebase for offline access
          setLocalValue(data);
        } else {
          // If no data in Firebase, initialize it with local/initial data
          set(dbRef, localValue);
          setSyncedValue(localValue);
        }
      });
      return () => unsubscribe();
    }
  }, [firebaseConnected, dbPath, key, setLocalValue]); // Removed localValue dependency to prevent loops

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(firebaseConnected ? syncedValue : localValue) : value;
      
      if (firebaseConnected && dbPath) {
        const dbRef = ref(db, dbPath);
        set(dbRef, valueToStore);
        // The onValue listener will update the state, no need to call setSyncedValue here.
      }
      
      // Always update local storage for offline access and speed
      setLocalValue(valueToStore);
      if (!firebaseConnected) {
        setSyncedValue(valueToStore); // If offline, update the state directly
      }
    },
    [firebaseConnected, dbPath, localValue, syncedValue, setLocalValue]
  );

  return [firebaseConnected ? syncedValue : localValue, setValue];
}

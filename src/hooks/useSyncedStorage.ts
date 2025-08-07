
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useLocalStorage } from './useLocalStorage';

// This is the primary hook for data storage.
// It automatically handles synchronization with Firestore if connected,
// otherwise it falls back to using simple localStorage.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Always use local storage as the initial state and for offline fallback.
  const [localValue, setLocalValue] = useLocalStorage<T>(key, initialValue);
  const [syncedValue, setSyncedValue] = useState<T>(localValue);
  
  const firebaseConnected = isFirebaseConnected();
  
  // Path in Firestore: collection 'app_data', document named by key
  const COLLECTION_NAME = 'app_data';

  useEffect(() => {
    if (firebaseConnected && key) {
      const docRef = doc(db, COLLECTION_NAME, key);

      // Listener for real-time updates from Firestore
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()?.value as T;
          if (data !== undefined && data !== null) {
            setSyncedValue(data);
          }
        } else {
          // If no document in Firestore, it's the first run for this key.
          // The 'localValue' from useLocalStorage already holds the legacy data.
          // Write this legacy data to Firestore to migrate it.
          console.log(`Document '${key}' not found in Firestore. Migrating local data...`);
          setDoc(docRef, { value: localValue });
          setSyncedValue(localValue);
        }
      }, (error) => {
        console.error(`Error listening to Firestore document '${key}':`, error);
      });

      return () => unsubscribe();
    } else {
      // If not connected to firebase, the local value is the source of truth.
      setSyncedValue(localValue);
    }
  }, [firebaseConnected, key, localValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Allow value to be a function, like in useState
      const valueToStore = value instanceof Function ? value(syncedValue) : value;
      
      // Update the local state immediately for a responsive UI
      setLocalValue(valueToStore);
      setSyncedValue(valueToStore);
      
      if (firebaseConnected && key) {
        const docRef = doc(db, COLLECTION_NAME, key);
        // The value is wrapped in a 'value' field to be stored in the document
        setDoc(docRef, { value: valueToStore }).catch(error => {
            console.error(`Error writing to Firestore document '${key}':`, error);
        });
      }
    },
    [firebaseConnected, key, syncedValue, setLocalValue]
  );

  return [syncedValue, setValue];
}

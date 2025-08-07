
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useLocalStorage } from './useLocalStorage';

// This is the primary hook for data storage.
// It automatically handles synchronization with Firestore if connected,
// otherwise it falls back to using simple localStorage.
export function useSyncedStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [localValue, setLocalValue] = useLocalStorage<T>(`local_${key}`, initialValue);
  const [syncedValue, setSyncedValue] = useState<T>(initialValue);
  
  const firebaseConnected = isFirebaseConnected();
  
  // Path in Firestore: collection 'app_data', document named by key
  const COLLECTION_NAME = 'app_data';

  useEffect(() => {
    if (firebaseConnected && key) {
      const docRef = doc(db, COLLECTION_NAME, key);

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()?.value as T;
          if (data !== undefined && data !== null) {
            setSyncedValue(data);
            // Keep local storage in sync with Firebase for offline access
            setLocalValue(data);
          }
        } else {
          // If no document in Firestore, perform a one-time migration from localStorage
          console.log(`Document '${key}' not found in Firestore. Migrating local data...`);
          getDoc(docRef).then(docSnap => {
            // Check again to prevent race conditions
            if (!docSnap.exists()) {
                // Use the value from localStorage (which was loaded into localValue)
                setDoc(docRef, { value: localValue });
                setSyncedValue(localValue);
            }
          });
        }
      }, (error) => {
        console.error(`Error listening to Firestore document '${key}':`, error);
      });
      return () => unsubscribe();
    }
  }, [firebaseConnected, key, setLocalValue, localValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(firebaseConnected ? syncedValue : localValue) : value;
      
      if (firebaseConnected && key) {
        const docRef = doc(db, COLLECTION_NAME, key);
        // The value is wrapped in a 'value' field to be stored in the document
        setDoc(docRef, { value: valueToStore }).catch(error => {
            console.error(`Error writing to Firestore document '${key}':`, error);
        });
        // The onValue listener will update the state, no need to call setSyncedValue here.
      }
      
      // Always update local storage for offline access and speed
      setLocalValue(valueToStore);
      if (!firebaseConnected) {
        setSyncedValue(valueToStore); // If offline, update the state directly
      }
    },
    [firebaseConnected, key, localValue, syncedValue, setLocalValue]
  );

  return [firebaseConnected ? syncedValue : localValue, setValue];
}

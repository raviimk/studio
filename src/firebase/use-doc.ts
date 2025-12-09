
'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useFirestore } from '.';

interface Options {
  listen?: boolean;
}

export const useDoc = <T extends DocumentData>(
  path: string | null,
  options?: Options
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !path) {
      setLoading(false);
      return;
    }

    const docRef = doc(firestore, path);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
};

    
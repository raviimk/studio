
'use client';

import { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { useFirestore } from '.';

interface Options {
  listen: boolean;
}

export const useCollection = <T extends DocumentData>(
  path: string | null,
  options?: Options
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const firestore = useFirestore();
  const pathRef = useRef(path);
  pathRef.current = path;

  useEffect(() => {
    if (!firestore || !pathRef.current) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const collectionQuery: Query<DocumentData> = query(collection(firestore, pathRef.current));

    const unsubscribe = onSnapshot(
      collectionQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  return { data, loading, error };
};

    
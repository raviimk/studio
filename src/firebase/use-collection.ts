
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
  collectionQuery: Query<DocumentData> | null,
  options?: Options
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const queryRef = useRef(collectionQuery);
  queryRef.current = collectionQuery;

  useEffect(() => {
    if (!queryRef.current) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      queryRef.current,
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
        console.error(err);
      }
    );

    return () => unsubscribe();
  }, [collectionQuery]);

  return { data, loading, error };
};

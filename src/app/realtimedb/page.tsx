
'use client';

import React, { useState, useEffect } from 'react';
import { db, isFirebaseConnected } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function RealtimeDataPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConnected()) {
      setError("Firebase is not connected. Please check your configuration.");
      setLoading(false);
      return;
    }

    const dataRef = ref(db, 'data/');
    
    // Set up the real-time listener
    const unsubscribe = onValue(dataRef, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    }, (error) => {
      console.error(error);
      setError("Failed to fetch real-time data. Check console for details.");
      setLoading(false);
    });

    // Clean up the listener on component unmount
    return () => {
      off(dataRef); // Detach the listener
    };
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Real-time Database Viewer" description="Live view of all data stored in the Firebase Realtime Database." />
      <Card>
        <CardHeader>
          <CardTitle>Live Data from 'data/' Node</CardTitle>
          <CardDescription>
            This data updates automatically when changes occur in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="mr-2 h-8 w-8 animate-spin" />
              <span>Connecting to Firebase...</span>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && (
            <pre className="p-4 rounded-md bg-muted overflow-auto max-h-[70vh]">
              <code>
                {JSON.stringify(data, null, 2)}
              </code>
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

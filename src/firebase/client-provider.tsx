
'use client';
import { ReactNode } from 'react';

// This is a simple client provider that can be used to wrap around the root layout.
// It doesn't do anything special, but it's a good place to add any client-side
// setup that you might need in the future.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

    
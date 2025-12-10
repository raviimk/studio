'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/AppShell';
import IntroAnimation from '@/components/IntroAnimation';
import { useState, useEffect } from 'react';
import { SystemStateProvider } from '@/hooks/useSystemState';
import { LayoutProvider } from '@/hooks/useLayout';
import { FirebaseProvider } from '@/firebase/provider';


const SHOW_INTRO = true; // Master switch for the intro animation
const INTRO_SESSION_KEY = 'introPlayed';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [introFinished, setIntroFinished] = useState(!SHOW_INTRO);

  useEffect(() => {
    if (SHOW_INTRO) {
      const introHasPlayed = sessionStorage.getItem(INTRO_SESSION_KEY);
      if (introHasPlayed) {
        setIntroFinished(true);
      } else {
        sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
      }
    }
  }, []);

  useEffect(() => {
    document.title = 'ATIXE Diamond';
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ATIXE Diamond</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💠</text></svg>" />
        <meta name="description" content="Diamond Production Manager – Sarin + Laser Unified Tracker" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Montserrat:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseProvider>
            <SystemStateProvider>
                <LayoutProvider>
                  {!introFinished ? (
                    <IntroAnimation onFinished={() => setIntroFinished(true)} />
                  ) : (
                    <div className="animate-simple-fade-in">
                      <AppShell>{children}</AppShell>
                      <Toaster />
                    </div>
                  )}
                </LayoutProvider>
            </SystemStateProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}

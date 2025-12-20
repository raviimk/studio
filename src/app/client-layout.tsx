
'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import IntroAnimation from '@/components/IntroAnimation';

const SHOW_INTRO = true; // Master switch for the intro animation
const INTRO_SESSION_KEY = 'introPlayed';

export function ClientLayout({ children }: { children: React.ReactNode }) {
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

  if (!introFinished) {
    return <IntroAnimation onFinished={() => setIntroFinished(true)} />;
  }

  return (
    <div className="animate-simple-fade-in">
      <AppShell>{children}</AppShell>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
// Set this to false to disable the intro animation completely
const SHOW_INTRO = true;
// -------------------

const INTRO_SESSION_KEY = 'introPlayed';

export default function IntroAnimation() {
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  const [isComponentVisible, setIsComponentVisible] = useState(true);

  useEffect(() => {
    const introHasPlayed = sessionStorage.getItem(INTRO_SESSION_KEY);

    if (SHOW_INTRO && !introHasPlayed) {
      setIsAnimationActive(true);
      sessionStorage.setItem(INTRO_SESSION_KEY, 'true');

      // Timer to hide the component after animation completes
      const timer = setTimeout(() => {
        setIsComponentVisible(false);
      }, 4000); // This duration should match the total animation time

      return () => clearTimeout(timer);
    } else {
      // If intro is disabled or already played, hide it immediately
      setIsComponentVisible(false);
    }
  }, []);

  if (!isComponentVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black transition-opacity duration-1000',
        isAnimationActive ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        animation: isAnimationActive ? 'fadeOut 1s ease-out 3s forwards' : 'none',
      }}
    >
      <style jsx>{`
        @keyframes fadeOut {
          to {
            opacity: 0;
            pointer-events: none;
          }
        }
      `}</style>
      <h1 className="font-display text-4xl md:text-6xl text-white animate-fade-in-glow" style={{ animationDelay: '0.5s' }}>
        ATIXE DIAMOND
      </h1>
      <p className="font-headline text-lg md:text-2xl text-white/70 animate-fade-in-glow" style={{ animationDelay: '1.5s' }}>
        BY <span className="text-white font-semibold tracking-wider">RAVII</span>
      </p>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
// Set this to false to disable the intro animation completely
const SHOW_INTRO = true;
// -------------------

const INTRO_SESSION_KEY = 'introPlayed';

export default function IntroAnimation() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [hideComponent, setHideComponent] = useState(false);

  useEffect(() => {
    const introHasPlayed = sessionStorage.getItem(INTRO_SESSION_KEY);

    if (SHOW_INTRO && !introHasPlayed) {
      setShowAnimation(true);
      sessionStorage.setItem(INTRO_SESSION_KEY, 'true');

      // Timer to hide the component after animation
      const timer = setTimeout(() => {
        setHideComponent(true);
      }, 4000); // Total duration before it's removed from DOM

      return () => clearTimeout(timer);
    } else {
      // If intro is disabled or already played, hide it immediately
      setHideComponent(true);
    }
  }, []);

  if (hideComponent) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black transition-opacity duration-1000',
        showAnimation ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        animation: 'fadeOut 1s ease-out 3s forwards',
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

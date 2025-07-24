'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
// Set this to false to disable the intro animation completely
const SHOW_INTRO = true;
// -------------------

const INTRO_SESSION_KEY = 'introPlayed';

const Title = ({ text }: { text: string }) => {
  return (
    <h1
      className="font-display text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wide text-white/90"
      style={{ textShadow: '0px 2px 10px rgba(0,0,0,0.3)' }}
    >
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="inline-block"
          style={{
            animation: `slide-in 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
            animationDelay: `${0.3 + index * 0.05}s`,
            opacity: 0,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  );
};

const GoldenShimmer = () => (
   <div className="absolute inset-x-0 top-1/2 h-20 -translate-y-1/2"
        style={{
             background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent)',
             animation: 'shimmer 2.5s cubic-bezier(0.7, 0, 0.3, 1) forwards',
             animationDelay: '1s'
        }}
    />
);


export default function IntroAnimation() {
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  const [isComponentVisible, setIsComponentVisible] = useState(false);

  useEffect(() => {
    const introHasPlayed = sessionStorage.getItem(INTRO_SESSION_KEY);

    if (SHOW_INTRO && !introHasPlayed) {
      setIsComponentVisible(true);
      
      const startTimer = setTimeout(() => {
        setIsAnimationActive(true);
        sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
      }, 100);

      const endTimer = setTimeout(() => {
        setIsComponentVisible(false);
      }, 3500); // Total duration of the intro

      return () => {
          clearTimeout(startTimer);
          clearTimeout(endTimer);
      };
    }
  }, []);

  if (!isComponentVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black transition-opacity duration-500',
        isAnimationActive ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        animation: isAnimationActive ? 'simple-fade-in 0.3s forwards, simple-fade-in 1s reverse 2.5s forwards' : 'none',
      }}
    >
        <div className="relative">
            <Title text="ATIXE DIAMOND" />
            <GoldenShimmer/>
        </div>
    </div>
  );
}

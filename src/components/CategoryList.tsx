'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tv, Zap, ShieldAlert } from 'lucide-react';

interface Category {
  label: string;
  icon: string;
  slug: string | null;
}

interface CategoryListProps {
  categories: Category[];
  currentCategory?: string | null;
}

const AnimatedIcon = ({ icon, isActive }: { icon: string, isActive: boolean }) => {
  if (icon === 'fire') {
    return (
      <div className={cn("relative w-6 h-6 flex items-center justify-center", isActive && "animate-flame")}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full scale-125">
          {/* Outer Heat */}
          <path 
            d="M12 2.5C12 2.5 13.5 5 13.5 9C13.5 13 11.5 15 11.5 18C11.5 21 12.5 22.5 12.5 22.5C12.5 22.5 6.5 20.5 6.5 15C6.5 9.5 9 7.5 9 2.5C9 2.5 12 2.5 12 2.5Z" 
            fill="#ff4500" 
            className={cn(isActive && "animate-pulse")} 
          />
          {/* Middle Body */}
          <path 
            d="M12.5 22.5C12.5 22.5 18.5 20.5 18.5 15C18.5 9.5 16 7.5 16 2.5C16 2.5 12.5 2.5 12.5 2.5C12.5 2.5 14 5 14 9C14 13 12 15 12 18C12 21 12.5 22.5 12.5 22.5Z" 
            fill="#ff8c00" 
            opacity="0.8" 
            className={cn(isActive && "animate-pulse [animation-delay:0.1s]")} 
          />
          {/* Inner Core */}
          <path 
            d="M12.5 22.5C12.5 22.5 15 21.5 15 17C15 12.5 13.5 10.5 13.5 8C13.5 8 11.5 11 11.5 14C11.5 17 13.5 19 12.5 22.5Z" 
            fill="#ffd700" 
            opacity="0.9" 
            className={cn(isActive && "animate-pulse [animation-delay:0.2s]")} 
          />
        </svg>
      </div>
    );
  }

  if (icon === 'clapperboard') {
    return (
      <div className="relative w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-full h-full transition-colors", isActive ? "text-primary" : "text-muted-foreground/40")}>
          <path d="M4 11V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V11H4Z" fill={isActive ? "currentColor" : "none"} fillOpacity="0.1" />
          <g className={cn(isActive && "animate-clapper")}>
            <path d="M2 11L22 11L22 7C22 5.89543 21.1046 5 20 5L4 5C2.89543 5 2 5.89543 2 7L2 11Z" />
            <path d="M7 5L10 11" />
            <path d="M12 5L15 11" />
            <path d="M17 5L20 11" />
          </g>
        </svg>
      </div>
    );
  }

  if (icon === 'film') {
    return (
      <div className={cn("relative w-5 h-5", isActive && "animate-spin-reel")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-full h-full", isActive ? "text-primary" : "text-muted-foreground/40")}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
        </svg>
      </div>
    );
  }

  // Action / Sparking Bomb
  if (icon === 'bomb') {
    return (
      <div className="relative w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-full h-full transition-all duration-500", isActive ? "text-red-500" : "text-muted-foreground/40")}>
          <circle cx="11" cy="13" r="8" fill={isActive ? "currentColor" : "none"} fillOpacity="0.1" />
          <path d="M16 8L18 6" strokeWidth="2.5" />
          <path 
            d="M18 6C19 5 21 5 22 6" 
            className={cn(isActive && "animate-spark-fuse")} 
            stroke={isActive ? "#fbbf24" : "currentColor"}
            strokeDasharray="2 2"
          />
          {isActive && (
            <g className="animate-pulse">
              <circle cx="22" cy="6" r="2" fill="#facc15" />
              <path d="M22 2V4M25 6H23M22 10V8M19 6H21" stroke="#facc15" strokeWidth="1" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // Hindi Dubbed / Audio Pulse
  if (icon === 'languages') {
    return (
      <div className="relative w-5 h-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("w-full h-full transition-all duration-500", isActive ? "text-sky-400" : "text-muted-foreground/40")}>
          <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
          <path d="M16 14v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4" />
          <circle cx="6" cy="14" r="3" fill={isActive ? "currentColor" : "none"} fillOpacity="0.2" />
          <circle cx="18" cy="14" r="3" fill={isActive ? "currentColor" : "none"} fillOpacity="0.2" />
          {isActive && (
            <g className="animate-pulse-glow">
              <path d="M9 10c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 14h10" stroke="currentColor" strokeWidth="1" strokeDasharray="1 2" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  const baseClasses = cn(
    "w-5 h-5 transition-all duration-500",
    isActive ? "text-primary scale-110" : "text-muted-foreground/40 scale-100"
  );

  switch (icon) {
    case 'tiger':
      return <Zap className={cn(baseClasses, isActive && "animate-pulse-glow fill-primary/20")} />;
    case 'tv':
      return <Tv className={cn(baseClasses, isActive && "animate-bounce")} />;
    case 'adult':
      return <ShieldAlert className={cn(baseClasses, isActive && "animate-pulse-glow")} />;
    default:
      return null;
  }
};

export function CategoryList({ categories, currentCategory }: CategoryListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentCategory]);

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-hide pt-2" ref={scrollRef}>
      <div className="flex items-center gap-4 min-w-max px-2">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug || (!currentCategory && cat.slug === null);
          return (
            <Link
              key={cat.label}
              href={cat.slug ? `/?category=${cat.slug}` : "/"}
              data-active={isActive}
              className={cn(
                "relative px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 border shadow-2xl flex items-center gap-3 group overflow-hidden transform-gpu active:scale-95",
                isActive 
                  ? "bg-zinc-900 text-white border-primary/50 animate-active-tab-glow scale-105" 
                  : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/10 to-primary/20 animate-color-shift-bg pointer-events-none" />
              )}
              
              <div className={cn("relative z-10 transition-transform duration-500", isActive ? "scale-110" : "scale-100 group-hover:scale-110")}>
                <AnimatedIcon icon={cat.icon} isActive={isActive} />
              </div>
              
              <span className="relative z-10">{cat.label}</span>
              
              {isActive && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

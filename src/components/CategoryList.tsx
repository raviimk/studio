'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Clapperboard, Film, Languages, Tv, Zap, ShieldAlert, Radio } from 'lucide-react';

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
      <div className={cn("relative w-6 h-6", isActive && "animate-flame")}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M12 2C12 2 13 4 13 8C13 12 11 14 11 17C11 20 12 22 12 22C12 22 7 20 7 15C7 10 9 8 9 2C9 2 12 2 12 2Z" fill="#ff4500" />
          <path d="M12 22C12 22 17 20 17 15C17 10 15 8 15 2C15 2 12 2 12 2C12 2 13 4 13 8C13 12 11 14 11 17C11 20 12 22 12 22Z" fill="#ff8c00" opacity="0.8" />
          <path d="M12 22C12 22 14.5 21 14.5 17C14.5 13 13 11 13 8C13 8 12 10 12 13C12 16 13 18 12 22Z" fill="#ffd700" opacity="0.9" />
        </svg>
      </div>
    );
  }

  const baseClasses = cn(
    "w-5 h-5 transition-all duration-500",
    isActive ? "text-primary scale-125" : "text-muted-foreground/50 scale-100"
  );

  switch (icon) {
    case 'clapperboard':
      return <Clapperboard className={cn(baseClasses, isActive && "animate-clapper")} />;
    case 'film':
      return <Film className={cn(baseClasses, isActive && "animate-spin-slow")} />;
    case 'languages':
      return <Languages className={cn(baseClasses, isActive && "animate-pulse-soft")} />;
    case 'tiger':
      return <Zap className={cn(baseClasses, isActive && "animate-pulse fill-primary/20")} />;
    case 'tv':
      return <Tv className={cn(baseClasses, isActive && "animate-bounce")} />;
    case 'bomb':
      return (
        <div className="relative">
          <Radio className={cn(baseClasses, isActive && "animate-pulse")} />
          {isActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-spark" />}
        </div>
      );
    case 'adult':
      return <ShieldAlert className={cn(baseClasses, isActive && "animate-spin-slow")} />;
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
                "relative px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 border shadow-2xl flex items-center gap-3 group overflow-hidden",
                isActive 
                  ? "bg-zinc-900 text-white border-primary/50 animate-tab-active-glow scale-105" 
                  : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {/* Floating Background Effect */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 animate-color-shift-bg pointer-events-none" />
              )}
              
              <AnimatedIcon icon={cat.icon} isActive={isActive} />
              
              <span className="relative z-10">{cat.label}</span>
              
              {/* Indicator Dot */}
              {isActive && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

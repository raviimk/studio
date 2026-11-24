'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  const getEmoji = (icon: string) => {
    switch (icon) {
      case 'fire': return '🔥';
      case 'clapperboard': return '🎬';
      case 'film': return '📽️';
      case 'languages': return '🌐';
      case 'tiger': return '🐯';
      case 'tv': return '📺';
      case 'bomb': return '💣';
      case 'adult': return '🔞';
      default: return '📁';
    }
  };

  return (
    <div className={cn(
      "text-xl sm:text-2xl transition-all duration-500 transform-gpu select-none",
      isActive ? "scale-125 animate-bounce drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "scale-100 opacity-50 grayscale"
    )}>
      {getEmoji(icon)}
    </div>
  );
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

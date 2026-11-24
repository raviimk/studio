'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Category {
  label: string;
  emoji: string;
  slug: string | null;
}

interface CategoryListProps {
  categories: Category[];
  currentCategory?: string | null;
}

export function CategoryList({ categories, currentCategory }: CategoryListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the active category into view smoothly when the category changes
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
                "relative px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 border shadow-2xl flex items-center gap-2 group overflow-hidden",
                isActive 
                  ? "bg-zinc-900 text-white border-primary/50 animate-tab-active-glow" 
                  : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {/* Floating Background Effect */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 animate-color-shift-bg pointer-events-none" />
              )}
              
              {/* Emoji with bounce */}
              <span className={cn(
                "text-lg transition-transform duration-500",
                isActive ? "animate-emoji-bounce scale-110" : "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
              )}>
                {cat.emoji}
              </span>
              
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

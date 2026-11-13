'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Category {
  label: string;
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
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide" ref={scrollRef}>
      <div className="flex items-center gap-3 min-w-max px-1">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug || (!currentCategory && cat.slug === null);
          return (
            <Link
              key={cat.label}
              href={cat.slug ? `/?category=${cat.slug}` : "/"}
              data-active={isActive}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 border shadow-lg hover:scale-105 active:scale-95",
                isActive 
                  ? "bg-gradient-to-r from-primary to-blue-600 text-white border-primary/50 shadow-primary/20" 
                  : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function Header() {
  const [query, setQuery] = useState("");
  const [animationData, setAnimationData] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  // Load animation data on mount
  useEffect(() => {
    fetch("https://lottie.host/809c9f6d-368b-4a57-9d7a-8b1a43a01a35/7pS9P7N1mS.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  // Handle Scroll logic for background effects
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled);
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-white/5 transition-all duration-300 ease-out py-2",
      isScrolled 
        ? "bg-background/95 backdrop-blur-2xl shadow-2xl" 
        : "bg-background/80 backdrop-blur-xl"
    )}>
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 transform-gpu">
        {/* Branding Block - Always Compact and Left-Aligned */}
        <Link 
          href="/" 
          className="flex items-center gap-2 group shrink-0 transition-all duration-300 transform-gpu scale-95"
        >
          {/* Logo container */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300 group-hover:scale-110 shrink-0 transform-gpu">
            {animationData && (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                className="w-full h-full"
              />
            )}
          </div>
          
          {/* Main Title */}
          <span className="font-black tracking-tighter animate-text-shimmer transition-all duration-300 text-xl sm:text-2xl">
            RV MOVIES
          </span>
        </Link>

        {/* Search Bar - Always Compact and Right-Aligned */}
        <form 
          onSubmit={handleSearch} 
          className="relative flex transition-all duration-300 transform-gpu w-40 sm:w-64 md:w-80"
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search movies..."
            className="w-full bg-white/5 border-white/10 pr-3 h-9 pl-8 text-xs sm:text-sm focus:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-all duration-300 rounded-full transform-gpu"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}

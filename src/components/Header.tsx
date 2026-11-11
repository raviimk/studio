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

  // Handle Scroll logic with improved smoothness
  useEffect(() => {
    const handleScroll = () => {
      // Use a smaller threshold for a more responsive "live" feel
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
      "sticky top-0 z-50 w-full border-b border-white/5 transition-all duration-500 ease-out",
      isScrolled 
        ? "bg-background/95 backdrop-blur-2xl py-2 shadow-2xl" 
        : "bg-background/0 py-6"
    )}>
      <div className={cn(
        "container mx-auto flex transition-all duration-700 ease-in-out px-4 transform-gpu",
        isScrolled 
          ? "flex-row items-center justify-between gap-4" 
          : "flex-col items-center gap-6"
      )}>
        {/* Branding Block */}
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-3 group shrink-0 transition-all duration-700 ease-in-out transform-gpu",
            isScrolled ? "justify-start scale-95" : "justify-center w-full scale-100"
          )}
        >
          {/* Logo container */}
          <div className={cn(
            "transition-all duration-700 ease-in-out group-hover:scale-110 shrink-0 transform-gpu",
            isScrolled ? "w-8 h-8 sm:w-10 sm:h-10" : "w-12 h-12 sm:w-16 sm:h-16"
          )}>
            {animationData && (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                className="w-full h-full"
              />
            )}
          </div>
          
          {/* Main Title */}
          <span className={cn(
            "font-black tracking-tighter animate-text-shimmer transition-all duration-700 ease-in-out transform-gpu",
            isScrolled ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl md:text-5xl"
          )}>
            RV MOVIES
          </span>

          {/* Symmetrical Spacer to keep text exactly centered when NOT scrolled */}
          {!isScrolled && (
            <div className="w-12 h-12 sm:w-16 sm:h-16 invisible shrink-0 hidden sm:block" aria-hidden="true" />
          )}
        </Link>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch} 
          className={cn(
            "relative flex transition-all duration-700 ease-in-out transform-gpu",
            isScrolled ? "w-40 sm:w-64 md:w-80" : "w-full max-w-xl"
          )}
        >
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-500",
            isScrolled ? "h-4 w-4" : "h-5 w-5"
          )} />
          <Input
            type="search"
            placeholder="Search movies..."
            className={cn(
              "w-full bg-white/5 border-white/10 pr-4 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-all duration-700 rounded-full transform-gpu",
              isScrolled ? "h-9 pl-9 text-xs sm:text-sm" : "h-12 pl-12 text-base"
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}

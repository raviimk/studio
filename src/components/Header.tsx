"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function Header() {
  const [query, setQuery] = useState("");
  const [animationData, setAnimationData] = useState<any>(null);
  const router = useRouter();

  // Load animation data on mount
  useEffect(() => {
    fetch("https://lottie.host/809c9f6d-368b-4a57-9d7a-8b1a43a01a35/7pS9P7N1mS.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col items-center gap-6 py-6 px-4">
        {/* Branding Block - Perfectly Centered */}
        <Link href="/" className="flex items-center justify-center gap-3 group shrink-0 w-full">
          {/* Logo container */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 transition-transform duration-300 group-hover:scale-110 shrink-0">
            {animationData && (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                className="w-full h-full"
              />
            )}
          </div>
          
          {/* Main Title */}
          <span className="text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl animate-text-shimmer group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all">
            RV MOVIES
          </span>

          {/* Symmetrical Spacer to keep text exactly centered */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 invisible shrink-0 hidden sm:block" aria-hidden="true" />
        </Link>

        <form onSubmit={handleSearch} className="relative flex w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search movies, series and more..."
            className="w-full bg-white/5 border-white/10 pl-12 pr-4 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-all rounded-full h-12 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}

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
      // For now we navigate back to home with the query (home could handle filtering)
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-auto min-h-16 flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-0 px-4">
        <Link href="/" className="flex items-center gap-1 group shrink-0 self-center sm:self-auto">
          <div className="w-12 h-12 -ml-2 transition-transform duration-300 group-hover:scale-110">
            {animationData && (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                className="w-full h-full"
              />
            )}
          </div>
          <span className="text-2xl font-black tracking-tighter sm:text-3xl animate-text-shimmer group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all">
            RV MOVIES
          </span>
        </Link>

        <form onSubmit={handleSearch} className="relative flex w-full max-w-md sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search movies..."
            className="w-full bg-white/5 border-white/10 pl-10 pr-4 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-all rounded-full h-10 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}

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
      // In a real app, you'd navigate to a search results page
      console.log("Searching for:", query);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1 group">
          <div className="w-10 h-10 -ml-2 transition-transform duration-300 group-hover:scale-110">
            {animationData && (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                className="w-full h-full"
              />
            )}
          </div>
          <span className="text-xl font-black tracking-tighter sm:text-2xl bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent group-hover:to-primary transition-all">
            RV MOVIES
          </span>
        </Link>

        <form onSubmit={handleSearch} className="relative hidden sm:flex w-full max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search movies..."
            className="w-full bg-white/5 border-white/10 pl-10 pr-4 focus:bg-white/10 transition-all rounded-full h-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { Search, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Assuming a search implementation might come later, 
      // for now we'll just log or redirect
      console.log("Searching for:", query);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <Play fill="currentColor" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tighter sm:text-2xl">
            RV MOVIES
          </span>
        </Link>

        <form onSubmit={handleSearch} className="relative hidden sm:flex w-full max-w-sm ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search movies..."
            className="w-full bg-secondary pl-9 pr-4 focus-visible:ring-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        
        {/* Mobile Search Toggle could go here */}
      </div>
    </header>
  );
}
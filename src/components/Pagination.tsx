"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  category?: string;
}

export function Pagination({ currentPage, totalPages = 975, category }: PaginationProps) {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  const getBaseUrl = (page: number | string) => {
    // App URL structure remains standard query params
    let url = `/?page=${page}`;
    if (category) url += `&category=${category}`;
    return url;
  };

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(inputValue);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      router.push(getBaseUrl(pageNum));
      setInputValue("");
    }
  };

  const nextPage = currentPage < totalPages ? currentPage + 1 : totalPages;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="mt-16 flex flex-col items-center gap-6">
      {/* Visual Pagination Bar */}
      <div className="pagination-container shadow-2xl">
        {getPages().map((page, idx) => (
          <div key={idx}>
            {page === "..." ? (
              <span className="pagination-item text-muted-foreground">...</span>
            ) : (
              <Link
                href={getBaseUrl(page)}
                className={cn(
                  "pagination-item",
                  currentPage === page && "pagination-item-active"
                )}
              >
                {page}
              </Link>
            )}
          </div>
        ))}
        
        <Link
          href={getBaseUrl(nextPage)}
          className="pagination-next group"
        >
          Next <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Manual Page Jump */}
      <form onSubmit={handleGo} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Jump to</span>
        <div className="relative">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={currentPage.toString()}
            className="w-14 bg-transparent border-b border-white/20 px-1 py-0.5 text-center text-sm font-bold focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <button 
          type="submit"
          className="bg-primary/20 text-primary hover:bg-primary hover:text-white p-1.5 rounded-full transition-all duration-300"
          aria-label="Go to page"
        >
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}

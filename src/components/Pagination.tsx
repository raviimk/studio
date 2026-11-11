import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
}

export function Pagination({ currentPage, totalPages = 975 }: PaginationProps) {
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage + 1;

  // Logic to show a few pages and an ellipsis
  const getPages = () => {
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-16 flex items-center justify-center">
      <div className="pagination-container shadow-2xl">
        {getPages().map((page, idx) => (
          <div key={idx}>
            {page === "..." ? (
              <span className="pagination-item text-muted-foreground">...</span>
            ) : (
              <Link
                href={`/?page=${page}`}
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
          href={`/?page=${nextPage}`}
          className="pagination-next group"
        >
          Next <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
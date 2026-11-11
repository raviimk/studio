import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({ currentPage }: { currentPage: number }) {
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage + 1;

  return (
    <div className="mt-12 flex items-center justify-center gap-4">
      {prevPage && (
        <Link
          href={`/?page=${prevPage}`}
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <ChevronLeft size={16} /> Previous
        </Link>
      )}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
        {currentPage}
      </div>
      <Link
        href={`/?page=${nextPage}`}
        className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
      >
        Next <ChevronRight size={16} />
      </Link>
    </div>
  );
}
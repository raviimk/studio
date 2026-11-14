
import { LayoutGrid } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-[200px] w-full bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-md" />
      
      {/* Categories Skeleton */}
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 w-24 bg-white/5 rounded-full shrink-0" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-x-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[2/3] bg-white/5 rounded-xl" />
            <div className="h-4 w-3/4 bg-white/5 rounded" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

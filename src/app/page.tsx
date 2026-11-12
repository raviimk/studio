import { MovieCard } from "@/components/MovieCard";
import { Pagination } from "@/components/Pagination";

export interface Movie {
  title: string;
  slug: string;
  poster: string | null;
  posterBig?: string | null;
  img?: string | null;
  year?: string | null;
  quality?: string[];
  url?: string;
  host?: string;
}

interface ApiResponse {
  page?: number;
  lastPage?: number;
  base?: string;
  count: number;
  items: Movie[];
}

const MOVIE_API_BASE = "https://rvmovies.deathmaniya.workers.dev";
const SEARCH_API_BASE = "https://rvsrch.deathmaniya.workers.dev";

async function getMovies(page: number): Promise<ApiResponse> {
  const url = `${MOVIE_API_BASE}/api/page/${page}`;
  
  // Use cache: 'no-store' to ensure we never get cached or stuck data
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

async function getSearchResults(query: string): Promise<ApiResponse> {
  const url = `${SEARCH_API_BASE}/api/search?q=${encodeURIComponent(query)}`;
  
  // Use cache: 'no-store' to ensure fresh search results every time
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch search results");
  const data = await res.json();
  
  return {
    count: data.items?.length || 0,
    items: data.items || [],
    base: data.via
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const searchQuery = searchParams.search;
  const currentPage = parseInt(searchParams.page || "1");
  
  const isSearching = !!searchQuery;
  const data = isSearching 
    ? await getSearchResults(searchQuery)
    : await getMovies(currentPage);

  // Filter out APK files and other non-movie software items
  const filteredItems = (data.items || []).filter(item => {
    const isApk = 
      item.title?.toLowerCase().includes('.apk') || 
      item.slug?.toLowerCase().includes('.apk');
    return !isApk;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {isSearching ? `Search Results: ${searchQuery}` : "Latest Uploads"}
        </h2>
        <div className="flex flex-col items-end gap-1">
          {data.base && (
            <span className="text-xs font-medium text-primary animate-pulse">
              {isSearching ? `Via ${data.base}` : `Live from ${data.base.replace('https://', '')}`}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {filteredItems.length} {isSearching ? "results" : "items on this page"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-x-6">
        {filteredItems.map((movie) => (
          <MovieCard 
            key={movie.slug} 
            movie={movie} 
            baseApi={isSearching ? SEARCH_API_BASE : MOVIE_API_BASE}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex h-[40vh] items-center justify-center text-muted-foreground">
          {isSearching ? "No results found for your search." : "No movies found on this page."}
        </div>
      )}

      {!isSearching && (
        <Pagination currentPage={currentPage} totalPages={975} />
      )}
    </div>
  );
}

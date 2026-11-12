import { MovieCard } from "@/components/MovieCard";
import { Pagination } from "@/components/Pagination";

export const dynamic = 'force-dynamic';

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
  
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

async function getSearchResults(query: string): Promise<ApiResponse> {
  const url = `${SEARCH_API_BASE}/api/search?q=${encodeURIComponent(query)}`;
  
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
        {/* Rat Animated Corner */}
        <div className="scor">
          <div className="scor-ear scor-ear-left"></div>
          <div className="scor-ear-right-wrap">
            <div className="scor-ear scor-ear-right">
              <div className="scor-ear-right-fluff"></div>
            </div>
          </div>
          <div className="scor-head">
            <div className="scor-eye scor-eye-left"></div>
            <div className="scor-eye scor-eye-right"></div>
            <div className="scor-nose">
              <div className="scor-mouth">
                <div className="scor-mouth-line"></div>
                <div className="scor-mouth-outer"></div>
                <div className="scor-mouth-inner"></div>
              </div>
            </div>
            <div className="scor-blush scor-blush-left"></div>
            <div className="scor-blush scor-blush-right"></div>
            <div className="scor-face"></div>
            <div className="scor-face-fluff scor-face-fluff-left"></div>
            <div className="scor-face-fluff scor-face-fluff-right"></div>
          </div>
          <div className="scor-body">
            <div className="scor-neck"></div>
            <div className="scor-arm scor-arm-left"></div>
            <div className="scor-arm scor-arm-right"></div>
            <div className="scor-leg scor-leg-left">
              <div className="scor-leg-foot">
                <div className="scor-leg-foot-pad"></div>
              </div>
            </div>
            <div className="scor-leg scor-leg-right">
              <div className="scor-leg-foot">
                <div className="scor-leg-foot-pad"></div>
              </div>
            </div>
            <div className="scor-torso"></div>
            <div className="scor-tail"></div>
          </div>
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
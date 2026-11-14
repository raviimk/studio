import { MovieCard } from "@/components/MovieCard";
import { Pagination } from "@/components/Pagination";
import { CategoryList } from "@/components/CategoryList";
import { GhostLoader } from "@/components/GhostLoader";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

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
const CATEGORY_API_BASE = "https://rvmct.deathmaniya.workers.dev";

const CATEGORIES = [
  { label: "Latest", slug: null },
  { label: "Bollywood", slug: "bollywood-movies" },
  { label: "Hollywood", slug: "hollywood-movies" },
  { label: "Hindi Dubbed", slug: "hindi-dubbed" },
  { label: "South Hindi", slug: "south-hindi-movies" },
  { label: "Web Series", slug: "web-series" },
  { label: "Action", slug: "action-movies" },
  { label: "Adult", slug: "adult" },
];

async function getMovies(page: number): Promise<ApiResponse> {
  const url = `${MOVIE_API_BASE}/api/page/${page}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

async function getCategoryMovies(category: string, page: number): Promise<ApiResponse> {
  // Updated to use path parameter for page as per request: /api/category/slug/page
  const url = `${CATEGORY_API_BASE}/api/category/${category}/${page}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch category data");
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
  searchParams: { page?: string; search?: string; category?: string };
}) {
  const searchQuery = searchParams.search;
  const currentCategory = searchParams.category;
  const currentPage = parseInt(searchParams.page || "1");
  
  const isSearching = !!searchQuery;
  const isCategory = !!currentCategory;

  let data: ApiResponse;
  try {
    if (isSearching) {
      data = await getSearchResults(searchQuery);
    } else if (isCategory) {
      data = await getCategoryMovies(currentCategory, currentPage);
    } else {
      data = await getMovies(currentPage);
    }
  } catch (error) {
    throw error;
  }

  const filteredItems = (data.items || [])
    .filter(item => {
      const title = (item.title || "").toLowerCase();
      const isApk = title.includes('.apk') || item.slug?.toLowerCase().includes('.apk');
      const isMetaLink = 
        title.includes('join our group') || 
        title.includes('request a movie') || 
        title.includes('how to download') ||
        title.includes('contact us');
      const hasNoPoster = !item.poster && !item.posterBig && !item.img;
      
      return !isApk && !isMetaLink && !hasNoPoster;
    })
    .map(item => ({
      ...item,
      title: (item.title || "").replace(/HDHub4u/gi, "RV MOVIES")
    }));

  return (
    <div className="flex flex-col gap-8">
      {/* Compact Hero Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto">
          <GhostLoader />
          
          <div className="hidden sm:flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none truncate max-w-[200px] sm:max-w-none pr-2">
              {isSearching ? `Results` : isCategory ? CATEGORIES.find(c => c.slug === currentCategory)?.label : "Uploads"}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary opacity-80 truncate max-w-[200px] sm:max-w-none pr-2">
              {isSearching ? searchQuery : isCategory ? "CATEGORY EXPLORER" : "LATEST DISCOVERIES"}
            </p>
          </div>
        </div>

        <div className="max-w-md text-center md:text-right flex flex-col gap-3 relative z-10">
          <h3 className="text-xs font-black text-white/90 tracking-widest uppercase border-b border-primary/30 pb-2 inline-block md:ml-auto">
            ABOUT RV MOVIES
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
            Welcome to <span className="text-primary font-bold">RV MOVIES</span>, your ultimate platform for the latest cinema. We provide high-speed links in 4K, 1080p, 720p, and 480p quality.
          </p>
        </div>
      </div>

      <CategoryList categories={CATEGORIES} currentCategory={currentCategory} />

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-x-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        {filteredItems.map((movie) => (
          <MovieCard 
            key={movie.slug} 
            movie={movie} 
            baseApi={isSearching ? SEARCH_API_BASE : isCategory ? CATEGORY_API_BASE : MOVIE_API_BASE}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex h-[40vh] items-center justify-center text-muted-foreground font-black uppercase tracking-widest">
          {isSearching ? "No results found for your search." : "No movies found in this section."}
        </div>
      )}

      {!isSearching && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={data.lastPage || 975} 
          category={currentCategory || undefined}
        />
      )}
    </div>
  );
}

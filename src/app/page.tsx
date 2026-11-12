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
  page: number;
  lastPage: number;
  base: string;
  count: number;
  items: Movie[];
}

async function getMovies(page: number): Promise<ApiResponse> {
  const url = page === 1 
    ? "https://rvmovies.deathmaniya.workers.dev" 
    : `https://rvmovies.deathmaniya.workers.dev/api/page/${page}`;
  
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = parseInt(searchParams.page || "1");
  const data = await getMovies(currentPage);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Latest Uploads</h2>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-medium text-primary animate-pulse">Live from {data.base.replace('https://', '')}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{data.count} items on this page</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-x-6">
        {data.items.map((movie) => (
          <MovieCard key={movie.slug} movie={movie} />
        ))}
      </div>

      {data.items.length === 0 && (
        <div className="flex h-[40vh] items-center justify-center text-muted-foreground">
          No movies found on this page.
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={data.lastPage > 0 ? data.lastPage : 1000} />
    </div>
  );
}

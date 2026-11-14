import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import placeholders from "@/app/lib/placeholder-images.json";
import { Movie } from "@/app/page";
import { cn } from "@/lib/utils";

const DEFAULT_API_BASE = "https://rvmovies.deathmaniya.workers.dev";

function extractQualityFromTitle(title: string): string[] {
  const qualities = [];
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('4k') || lowerTitle.includes('2160p')) qualities.push('4K UHD');
  if (lowerTitle.includes('1080p')) qualities.push('1080p');
  if (lowerTitle.includes('720p')) qualities.push('720p');
  if (lowerTitle.includes('480p')) qualities.push('480p');
  if (lowerTitle.includes('hdtc') || lowerTitle.includes('hdtv')) qualities.push('HDTC');
  if (lowerTitle.includes('web-dl') || lowerTitle.includes('webrip')) qualities.push('WEB-DL');
  
  return qualities;
}

const normalizeProxyUrl = (url: string | null | undefined, base: string) => {
  if (!url) return placeholders.moviePoster;
  
  let finalUrl = url;
  if (!url.startsWith('http')) {
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    finalUrl = `${cleanBase}${cleanPath}`;
  }

  if (finalUrl.includes('catimages.co')) {
    return finalUrl.replace('catimages.co', 'catimages.org');
  }
  
  return finalUrl;
};

export function MovieCard({ movie, baseApi }: { movie: Movie, baseApi?: string }) {
  const effectiveBase = baseApi || DEFAULT_API_BASE;
  const posterSrc = normalizeProxyUrl(movie.posterBig || movie.poster || movie.img, effectiveBase);
    
  const qualities = (movie.quality && movie.quality.length > 0) 
    ? movie.quality 
    : extractQualityFromTitle(movie.title);

  return (
    <Link 
      href={`/movie/${movie.slug}?poster=${encodeURIComponent(posterSrc)}`} 
      scroll={true}
      className="group relative flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/5 bg-muted shadow-lg group-hover:border-primary/30 group-hover:shadow-primary/10">
        <Image
          src={posterSrc}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized 
          data-ai-hint="movie poster"
        />
      </div>

      <div className="flex flex-col gap-2 p-1">
        <div className="flex flex-wrap gap-1">
          {qualities.map((q) => {
            const is4K = q.toLowerCase().includes('4k') || q.toLowerCase().includes('2160');
            return (
              <Badge 
                key={q} 
                variant="secondary" 
                className={cn(
                  "text-[8px] sm:text-[9px] border-none font-black uppercase tracking-tighter px-1.5 py-0 leading-none h-4",
                  is4K 
                    ? "bg-blue-600 text-white animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                    : "bg-white/10 text-muted-foreground"
                )}
              >
                {q}
              </Badge>
            );
          })}
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs sm:text-sm font-bold leading-tight text-foreground/90 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          {movie.year && (
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{movie.year}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
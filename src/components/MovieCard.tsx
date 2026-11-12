
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import placeholders from "@/app/lib/placeholder-images.json";
import { Movie } from "@/app/page";

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
  if (url.startsWith('http')) return url;
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

export function MovieCard({ movie, baseApi }: { movie: Movie, baseApi?: string }) {
  const effectiveBase = baseApi || DEFAULT_API_BASE;
  
  // Use exact same logic as movie detail page
  const posterSrc = normalizeProxyUrl(movie.posterBig || movie.poster || movie.img, effectiveBase);
    
  const qualities = (movie.quality && movie.quality.length > 0) 
    ? movie.quality 
    : extractQualityFromTitle(movie.title);

  return (
    <Link 
      href={`/movie/${movie.slug}`} 
      className="group relative flex flex-col gap-3 transition-all duration-300 hover:-translate-y-2"
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
        <div className="movie-card-gradient absolute inset-0 flex flex-col justify-end p-3 opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {qualities.slice(0, 2).map((q) => (
              <Badge key={q} variant="secondary" className="bg-primary/80 text-[9px] text-white border-none backdrop-blur-md font-bold">
                {q}
              </Badge>
            ))}
            {qualities.length > 2 && (
              <Badge variant="secondary" className="bg-black/60 text-[9px] text-white border-none backdrop-blur-md">
                +{qualities.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-1 rounded-lg transition-all duration-300">
        <h3 className="text-xs sm:text-sm font-semibold leading-tight text-foreground/90 group-hover:text-primary line-clamp-2 transition-colors">
          {movie.title}
        </h3>
        {movie.year && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{movie.year}</span>
        )}
      </div>
    </Link>
  );
}

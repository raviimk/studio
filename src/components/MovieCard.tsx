import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Movie {
  title: string;
  slug: string;
  page: string;
  poster: string;
  year: string | null;
  quality: string[];
}

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link 
      href={`/movie/${movie.slug}`} 
      className="group relative flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-2"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border bg-muted shadow-lg">
        <Image
          src={movie.poster}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized 
        />
        <div className="movie-card-gradient absolute inset-0 flex flex-col justify-end p-3">
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {movie.quality.slice(0, 2).map((q) => (
              <Badge key={q} variant="secondary" className="bg-black/60 text-[10px] text-white border-none backdrop-blur-sm">
                {q}
              </Badge>
            ))}
            {movie.quality.length > 2 && (
              <Badge variant="secondary" className="bg-black/60 text-[10px] text-white border-none backdrop-blur-sm">
                +{movie.quality.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2 rounded-lg animate-rainbow-bg transition-all duration-1000 ease-in-out">
        <h3 className="text-sm font-medium leading-snug text-foreground/90 group-hover:text-primary transition-colors duration-300">
          {movie.title}
        </h3>
        {movie.year && (
          <span className="text-xs text-muted-foreground">{movie.year}</span>
        )}
      </div>
    </Link>
  );
}

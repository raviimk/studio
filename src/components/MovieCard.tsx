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
  // Clean up title to remove technical tags for a cleaner look if desired
  // const cleanTitle = movie.title.split(' (')[0];

  return (
    <Link 
      href={movie.page} 
      target="_blank"
      className="group relative flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-2"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border bg-muted shadow-lg">
        <Image
          src={movie.poster}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized // tmdb and external images usually fine
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
      <div className="flex flex-col gap-1 px-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90 group-hover:text-primary">
          {movie.title}
        </h3>
        {movie.year && (
          <span className="text-xs text-muted-foreground">{movie.year}</span>
        )}
      </div>
    </Link>
  );
}
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, Zap, Tv, Languages, FileText, Download, Star, Users, Clapperboard, Film } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import placeholders from "@/app/lib/placeholder-images.json";
import { TrailerPlayer } from "@/components/TrailerPlayer";

interface LinkItem {
  label: string;
  url: string;
  host: string;
  res?: string;
  size?: string;
}

interface Trailer {
  id: string;
  embed: string;
  url: string;
}

interface MovieDetail {
  title: string;
  slug: string;
  url: string;
  host: string;
  poster: string | null;
  description: string;
  downloads: LinkItem[];
  watch: LinkItem[];
  trailer?: Trailer;
  screenshots: string[];
  quality: string;
  resolutions: string[];
  imdb?: string;
  genre?: string;
  stars?: string;
  director?: string;
  language?: string;
  category?: string[];
}

const API_BASE = "https://rvmovies.deathmaniya.workers.dev";

async function getMovieDetails(slug: string): Promise<MovieDetail> {
  const res = await fetch(`${API_BASE}/api/movie/${slug}`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error("Failed to fetch movie details");
  const data = await res.json();
  if (!data || !data.title) notFound();
  return data;
}

const getQualityStyles = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('4k') || l.includes('2160')) return "text-blue-500 text-lg md:text-xl font-black tracking-tight";
  if (l.includes('1080')) return "text-blue-400 text-base md:text-lg font-bold";
  if (l.includes('720')) return "text-sky-400 text-sm md:text-base font-semibold";
  if (l.includes('480')) return "text-yellow-400 text-sm md:text-base font-semibold";
  return "text-foreground text-sm font-medium";
};

const getQualityRank = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('4k') || l.includes('2160')) return 4;
  if (l.includes('1080')) return 3;
  if (l.includes('720')) return 2;
  if (l.includes('480')) return 1;
  return 0;
};

export default async function MoviePage({ params }: { params: { slug: string } }) {
  const movie = await getMovieDetails(params.slug);

  const sortedDownloads = [...(movie.downloads || [])].sort((a, b) => getQualityRank(a.label) - getQualityRank(b.label));
  
  const posterSrc = movie.poster 
    ? (movie.poster.startsWith('/') ? `${API_BASE}${movie.poster}` : movie.poster)
    : placeholders.moviePoster;

  return (
    <div className="flex flex-col gap-10 pb-20 max-w-6xl mx-auto">
      <div className="px-4">
        <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ChevronLeft size={20} /> Back to Home
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px,1fr] gap-8 px-4 items-start">
        {/* Poster Block */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border-4 border-white/10 bg-muted shadow-2xl transition-transform hover:scale-[1.02] duration-500">
            <Image
              src={posterSrc}
              alt={movie.title}
              fill
              className="object-cover"
              unoptimized
              data-ai-hint="movie poster"
            />
          </div>
          
          {movie.imdb && (
            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
              <span className="text-yellow-500 font-black text-sm tracking-widest uppercase">IMDb RATING</span>
              <div className="flex items-center gap-1.5 text-yellow-500 font-black text-xl">
                <Star size={20} fill="currentColor" /> {movie.imdb.replace('/10', '')}
              </div>
            </div>
          )}
        </div>

        {/* Info Block */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-bold px-3 py-1 uppercase tracking-tighter">
                {movie.quality}
              </Badge>
              {(movie.resolutions || []).map((q) => (
                <Badge key={q} variant="outline" className="border-white/10 text-muted-foreground font-bold px-3 py-1">
                  {q}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-none">
              {movie.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movie.genre && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Genre</span>
                <p className="text-sm font-bold flex items-center gap-2"><Film size={14} className="text-primary"/> {movie.genre}</p>
              </div>
            )}
            {movie.language && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Language</span>
                <p className="text-sm font-bold flex items-center gap-2"><Languages size={14} className="text-primary"/> {movie.language}</p>
              </div>
            )}
            {movie.director && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Director</span>
                <p className="text-sm font-bold flex items-center gap-2"><Clapperboard size={14} className="text-primary"/> {movie.director}</p>
              </div>
            )}
            {movie.stars && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Cast</span>
                <p className="text-sm font-bold flex items-center gap-2 line-clamp-1"><Users size={14} className="text-primary"/> {movie.stars}</p>
              </div>
            )}
          </div>

          {movie.description && (
            <div className="prose prose-invert max-w-none text-left bg-white/5 p-6 rounded-2xl border border-white/10 shadow-inner">
              <h2 className="text-lg md:text-xl font-bold mb-3 text-primary flex items-center gap-2">
                <FileText size={20} /> Storyline
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {movie.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Section - Relocated here */}
      {movie.trailer && (
        <TrailerPlayer embedUrl={movie.trailer.embed} title={movie.title} />
      )}

      {/* Screenshots Section */}
      {movie.screenshots && movie.screenshots.length > 0 && (
        <section className="space-y-6 px-4 mt-8">
          <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
            <Zap size={24} className="text-yellow-400 fill-yellow-400" /> SCREENSHOTS
          </h2>
          <div className="flex flex-col gap-8">
            {movie.screenshots.map((s, idx) => {
              const imageUrl = s.startsWith('/') ? `${API_BASE}${s}` : s;

              return (
                <div key={idx} className="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-muted group shadow-2xl">
                  <Image
                    src={imageUrl}
                    alt={`Screenshot ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    unoptimized
                    data-ai-hint="movie screenshot"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Screenshot {idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Downloads Section */}
      {sortedDownloads.length > 0 && (
        <section className="bg-red-950/20 border-y border-red-500/10 py-10 mt-8">
          <div className="flex flex-col items-center">
            <h2 className="text-red-500 font-black text-sm md:text-lg tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
              <Download size={24} /> DOWNLOAD LINKS
            </h2>
            
            <div className="w-full flex flex-col max-w-4xl mx-auto px-4 gap-4">
              {sortedDownloads.map((link, idx) => (
                <Link 
                  key={idx}
                  href={link.url} 
                  target="_blank"
                  className="flex items-center justify-between py-5 px-8 bg-white/5 hover:bg-white/10 transition-all group rounded-2xl border border-white/5 hover:border-red-500/30"
                >
                  <span className={cn("flex items-center gap-3 transition-transform group-hover:scale-105", getQualityStyles(link.label))}>
                    {link.label.toLowerCase().includes('480p') && <Zap size={20} fill="currentColor" />}
                    {link.label}
                  </span>
                  <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-red-400 transition-colors tracking-[0.2em]">{link.host}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Watch Online Section */}
      {movie.watch && movie.watch.length > 0 && (
        <section className="bg-emerald-950/20 border-y border-emerald-500/10 py-10">
          <div className="flex flex-col items-center">
            <h2 className="text-emerald-400 font-black text-sm md:text-lg tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
              <Play size={24} fill="currentColor" /> WATCH ONLINE
            </h2>
            
            <div className="w-full flex flex-col max-w-4xl mx-auto px-4 gap-4">
              {movie.watch.map((link, idx) => {
                const label = (link.label.toUpperCase() === "WATCH" || link.label.toUpperCase() === "WATCH ONLINE") && movie.watch.length > 1 
                  ? `WATCH PLAYER ${idx + 1}` 
                  : link.label;

                return (
                  <Link 
                    key={idx}
                    href={link.url} 
                    target="_blank"
                    className="flex items-center justify-between py-5 px-8 bg-white/5 hover:bg-white/10 transition-all group rounded-2xl border border-white/5 hover:border-emerald-500/30"
                  >
                    <span className={cn("flex items-center gap-3 transition-transform group-hover:scale-105 font-bold text-white")}>
                      <Play size={20} fill="currentColor" className="text-emerald-400" />
                      {label}
                    </span>
                    <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-emerald-400 transition-colors tracking-[0.2em]">{link.host}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

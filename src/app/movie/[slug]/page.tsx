import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, Zap, Tv, Languages, FileText, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import placeholders from "@/app/lib/placeholder-images.json";

interface Screenshot {
  thumb: string;
  full: string;
  raw_thumb: string;
  raw_full: string;
}

interface LinkItem {
  label: string;
  url: string;
  host: string;
  quality: string | null;
  size: string | null;
  episode?: number;
}

interface MovieDetail {
  ok: boolean;
  title: string;
  poster: string | null;
  posterBig?: string | null;
  qualities: string[];
  screenshots: Screenshot[];
  trailer: string | null;
  downloads: LinkItem[];
  watch: LinkItem[];
  episodes?: LinkItem[];
  other: LinkItem[];
  synopsis: string;
  storyline?: string;
  review?: string;
  description?: string;
  audio_langs?: string | null;
}

const API_BASE = "https://rvmovies.deathmaniya.workers.dev";

async function getMovieDetails(slug: string): Promise<MovieDetail> {
  const cleanSlug = slug.endsWith('/') ? slug : `${slug}/`;
  const res = await fetch(`${API_BASE}/api/movie?u=${cleanSlug}`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error("Failed to fetch movie details");
  const data = await res.json();
  if (!data.ok) notFound();
  return data;
}

function getCleanDescription(movie: MovieDetail) {
  const candidates = [movie.review, movie.storyline, movie.description, movie.synopsis];
  
  for (const text of candidates) {
    if (!text || text.trim() === "" || text.trim().toUpperCase() === "N/A" || text.toLowerCase().includes("please watch and give reviews")) continue;
    
    let clean = text.trim();
    if (clean.includes("HDHub4u Home") || clean.includes("Search Here !!") || clean.length < 20) continue;

    const descriptionPrefix = "DESCRIPTION:";
    if (clean.toUpperCase().includes(descriptionPrefix)) {
      clean = clean.substring(clean.toUpperCase().indexOf(descriptionPrefix) + descriptionPrefix.length).trim();
    }

    const separatorIdx = clean.indexOf(" : ");
    if (separatorIdx !== -1 && separatorIdx < 120) {
        clean = clean.substring(separatorIdx + 3).trim();
    }
    
    if (clean.length > 10) return clean;
  }
  return null;
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
  const description = getCleanDescription(movie);

  const sortedDownloads = [...(movie.downloads || [])].sort((a, b) => getQualityRank(a.label) - getQualityRank(b.label));
  const sortedWatch = [...(movie.watch || [])].sort((a, b) => getQualityRank(a.label) - getQualityRank(b.label));
  
  const rawPoster = movie.posterBig || movie.poster;
  const posterSrc = rawPoster 
    ? (rawPoster.startsWith('/') ? `${API_BASE}${rawPoster}` : rawPoster)
    : placeholders.moviePoster;

  return (
    <div className="flex flex-col gap-10 pb-20 max-w-5xl mx-auto">
      <div className="px-4">
        <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ChevronLeft size={20} /> Back to Home
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center text-center gap-6 px-4">
        <div className="relative w-64 md:w-80 aspect-[2/3] overflow-hidden rounded-2xl border-4 border-white/10 bg-muted shadow-2xl transition-transform hover:scale-[1.02] duration-500">
          <Image
            src={posterSrc}
            alt={movie.title}
            fill
            className="object-cover"
            unoptimized
            data-ai-hint="movie poster"
          />
        </div>

        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="flex flex-wrap justify-center gap-2">
            {(movie.qualities || []).map((q) => (
              <Badge key={q} variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-bold px-3 py-1">
                {q}
              </Badge>
            ))}
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white leading-tight">
            {movie.title}
          </h1>

          {description && (
            <div className="prose prose-invert max-w-none text-left bg-white/5 p-6 rounded-2xl border border-white/10 mt-2 shadow-inner">
              <h2 className="text-lg md:text-xl font-bold mb-3 text-primary flex items-center gap-2">
                <FileText size={20} /> Description
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {movie.audio_langs && (
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs md:text-sm bg-primary/10 py-2.5 px-6 rounded-full border border-primary/20 mt-2 shadow-lg">
              <Languages size={18} />
              {movie.audio_langs}
            </div>
          )}
        </div>
      </div>

      {/* Screenshots Section */}
      {movie.screenshots && movie.screenshots.length > 0 && (
        <section className="space-y-6 px-4">
          <h2 className="text-2xl font-black flex items-center gap-2 justify-center md:justify-start tracking-tight">
            <Zap size={24} className="text-yellow-400 fill-yellow-400" /> SCREENSHOTS
          </h2>
          <div className="flex flex-col gap-8">
            {movie.screenshots.map((s, idx) => {
              const imageUrl = s.raw_thumb 
                ? `${API_BASE}/img?u=${encodeURIComponent(s.raw_thumb)}` 
                : null;

              if (!imageUrl) return null;

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

      {/* Episodes Section */}
      {movie.episodes && movie.episodes.length > 0 && (
        <section className="bg-blue-950/20 border-y border-blue-500/10 py-8">
          <div className="flex flex-col items-center">
            <h2 className="text-blue-400 font-black text-sm md:text-lg tracking-[0.2em] uppercase mb-6 flex items-center gap-3">
              <Tv size={24} /> EPISODES LIST
            </h2>
            <div className="w-full flex flex-col max-w-4xl mx-auto">
              {movie.episodes.map((link, idx) => (
                <Link 
                  key={idx}
                  href={link.url} 
                  target="_blank"
                  className="flex items-center justify-between py-5 px-6 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0"
                >
                  <span className="text-white text-base md:text-xl font-bold flex items-center gap-3 transition-transform group-hover:translate-x-2">
                    <Play size={18} fill="currentColor" className="text-blue-500" /> {link.label}
                  </span>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">EP {idx + 1}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Downloads Section */}
      {sortedDownloads.length > 0 && (
        <section className="bg-red-950/20 border-y border-red-500/10 py-8">
          <div className="flex flex-col items-center">
            <h2 className="text-red-500 font-black text-sm md:text-lg tracking-[0.2em] uppercase mb-6 flex items-center gap-3">
              <Download size={24} /> DOWNLOAD LINKS
            </h2>
            
            <div className="w-full flex flex-col max-w-4xl mx-auto">
              {sortedDownloads.map((link, idx) => (
                <Link 
                  key={idx}
                  href={link.url} 
                  target="_blank"
                  className="flex items-center justify-center py-6 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0"
                >
                  <span className={cn("flex items-center gap-3 transition-transform group-hover:scale-105", getQualityStyles(link.label))}>
                    {link.label.toLowerCase().includes('480p') && <Zap size={20} fill="currentColor" />}
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Watch Online Section */}
      {sortedWatch.length > 0 && (
        <section className="bg-emerald-950/20 border-y border-emerald-500/10 py-8">
          <div className="flex flex-col items-center">
            <h2 className="text-emerald-400 font-black text-sm md:text-lg tracking-[0.2em] uppercase mb-6 flex items-center gap-3">
              <Play size={24} fill="currentColor" /> WATCH ONLINE
            </h2>
            
            <div className="w-full flex flex-col max-w-4xl mx-auto">
              {sortedWatch.map((link, idx) => {
                const label = (link.label.toUpperCase() === "WATCH" || link.label.toUpperCase() === "WATCH ONLINE") && sortedWatch.length > 1 
                  ? `WATCH EP ${idx + 1}` 
                  : link.label;

                return (
                  <Link 
                    key={idx}
                    href={link.url} 
                    target="_blank"
                    className="flex items-center justify-center py-6 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0"
                  >
                    <span className={cn("flex items-center gap-3 transition-transform group-hover:scale-105", getQualityStyles(link.label))}>
                      <Play size={20} fill="currentColor" />
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Other Links Section */}
      {movie.other && movie.other.length > 0 && (
        <section className="bg-zinc-900/50 border-y border-white/5 py-8">
          <div className="flex flex-col items-center">
            <h2 className="text-muted-foreground font-black text-xs md:text-sm tracking-[0.3em] uppercase mb-4">
              OTHER LINKS
            </h2>
            <div className="flex flex-wrap justify-center gap-4 px-4">
              {movie.other.map((link, idx) => (
                <Button key={idx} variant="outline" size="sm" asChild className="bg-white/5 border-white/10 hover:bg-white/10">
                  <Link href={link.url} target="_blank">{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

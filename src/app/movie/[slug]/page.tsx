import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, Zap, Tv, Languages, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
  poster: string;
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
  // Priority order: review (highest quality usually), storyline, synopsis, description
  const candidates = [movie.review, movie.storyline, movie.synopsis, movie.description];
  
  for (const text of candidates) {
    if (!text || text.trim() === "" || text.trim().toUpperCase() === "N/A") continue;
    
    let clean = text.trim();
    
    // Filter out technical site noise and generic navigation text
    if (
      clean.includes("HDHub4u Home") || 
      clean.includes("Search Here !!") || 
      clean.includes("Categories Select Category") ||
      clean.toLowerCase().includes("please watch and give reviews")
    ) {
      continue;
    }

    // Remove common prefixes
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
  if (l.includes('4k') || l.includes('2160')) return "text-blue-500 text-lg md:text-xl font-bold";
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

  return (
    <div className="flex flex-col gap-10 pb-20 max-w-5xl mx-auto">
      <div className="px-4">
        <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ChevronLeft size={20} /> Back to Home
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center gap-6 px-4">
        <div className="relative w-64 md:w-80 aspect-[2/3] overflow-hidden rounded-2xl border-4 border-white/10 bg-muted shadow-2xl">
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="flex flex-wrap justify-center gap-2">
            {(movie.qualities || []).map((q) => (
              <Badge key={q} variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                {q}
              </Badge>
            ))}
          </div>

          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white leading-tight">
            {movie.title}
          </h1>

          {description && (
            <div className="prose prose-invert max-w-none text-left bg-white/5 p-6 rounded-2xl border border-white/10 mt-2">
              <h2 className="text-lg md:text-xl font-bold mb-3 text-primary flex items-center gap-2">
                <FileText size={20} /> Description
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {movie.audio_langs && (
            <div className="flex items-center justify-center gap-2 text-primary font-medium text-xs md:text-sm bg-primary/10 py-2 px-4 rounded-full border border-primary/20 mt-2">
              <Languages size={16} />
              {movie.audio_langs}
            </div>
          )}
        </div>
      </div>

      {/* Screenshots Gallery */}
      {movie.screenshots && movie.screenshots.length > 0 && (
        <section className="space-y-6 px-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
            Screenshots
          </h2>
          <div className="flex flex-col gap-8">
            {movie.screenshots.map((s, idx) => {
              // Use requested proxy format: worker_base/img?u=raw_thumb_url
              const imageUrl = s.raw_thumb 
                ? `${API_BASE}/img?u=${s.raw_thumb}` 
                : null;

              if (!imageUrl) return null;

              return (
                <div key={idx} className="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-muted group shadow-2xl">
                  <Image
                    src={imageUrl}
                    alt={`Screenshot ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Trailer */}
      {movie.trailer && (
        <section className="space-y-6 px-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
            <Play size={24} className="text-primary" /> Official Trailer
          </h2>
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg">
            <iframe
              src={movie.trailer}
              className="h-full w-full"
              allowFullScreen
              title="Movie Trailer"
            />
          </div>
        </section>
      )}

      {/* Episodes Section for Series */}
      {movie.episodes && movie.episodes.length > 0 && (
        <section className="bg-black/40 border-y border-white/5 py-4">
          <div className="flex flex-col items-center gap-0">
            <h2 className="text-blue-400 font-bold text-sm md:text-base tracking-widest uppercase mb-4 flex items-center gap-2">
              <Tv size={18} /> EPISODES
            </h2>
            <div className="w-full flex flex-col">
              {movie.episodes.map((link, idx) => (
                <div key={idx} className="w-full">
                  <Separator className="bg-white/10" />
                  <Link 
                    href={link.url} 
                    target="_blank"
                    className="flex items-center justify-center py-5 hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-white text-base md:text-lg font-bold flex items-center gap-2 transition-transform group-hover:scale-105">
                      <Play size={16} fill="currentColor" /> {link.label}
                    </span>
                  </Link>
                </div>
              ))}
              <Separator className="bg-white/10" />
            </div>
          </div>
        </section>
      )}

      {/* Download Links Section */}
      {sortedDownloads.length > 0 && (
        <section className="bg-black/40 border-y border-white/5 py-4">
          <div className="flex flex-col items-center gap-0">
            <h2 className="text-red-600 italic font-bold text-sm md:text-base tracking-widest uppercase mb-4">
              : DOWNLOAD LINKS :
            </h2>
            
            <div className="w-full flex flex-col">
              {sortedDownloads.map((link, idx) => (
                <div key={idx} className="w-full">
                  <Separator className="bg-white/10" />
                  <Link 
                    href={link.url} 
                    target="_blank"
                    className="flex items-center justify-center py-5 hover:bg-white/5 transition-colors group"
                  >
                    <span className={cn("flex items-center gap-2 transition-transform group-hover:scale-105", getQualityStyles(link.label))}>
                      {link.label.toLowerCase().includes('480p') && <Zap size={16} fill="currentColor" />}
                      {link.label}
                    </span>
                  </Link>
                </div>
              ))}
              <Separator className="bg-white/10" />
            </div>
          </div>
        </section>
      )}

      {/* Watch Online Section */}
      {sortedWatch.length > 0 && (
        <section className="bg-black/40 border-y border-white/5 py-4">
          <div className="flex flex-col items-center gap-0">
            <h2 className="text-emerald-400 font-bold text-sm md:text-base tracking-widest uppercase mb-4">
              WATCH ONLINE
            </h2>
            
            <div className="w-full flex flex-col">
              {sortedWatch.map((link, idx) => {
                // If label is "WATCH" and there are multiple links, treat as episodes
                const label = link.label.toUpperCase() === "WATCH" && sortedWatch.length > 1 
                  ? `WATCH EP ${idx + 1}` 
                  : link.label;

                return (
                  <div key={idx} className="w-full">
                    <Separator className="bg-white/10" />
                    <Link 
                      href={link.url} 
                      target="_blank"
                      className="flex items-center justify-center py-5 hover:bg-white/5 transition-colors group"
                    >
                      <span className={cn("flex items-center gap-2 transition-transform group-hover:scale-105", getQualityStyles(link.label))}>
                        <Play size={16} fill="currentColor" />
                        {label}
                      </span>
                    </Link>
                  </div>
                );
              })}
              <Separator className="bg-white/10" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

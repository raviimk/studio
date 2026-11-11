import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Download, ChevronLeft, Zap, Tv } from "lucide-react";
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
}

async function getMovieDetails(slug: string): Promise<MovieDetail> {
  const res = await fetch(`https://rvmovies.deathmaniya.workers.dev/api/movie?u=${slug}/`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error("Failed to fetch movie details");
  const data = await res.json();
  if (!data.ok) notFound();
  return data;
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

const cleanSynopsis = (text: string) => {
  if (!text) return "";
  
  let cleaned = text;

  // Try to find the actual description marker
  const descIndex = cleaned.toUpperCase().indexOf("DESCRIPTION:");
  if (descIndex !== -1) {
    // Take everything after "DESCRIPTION: :" or "DESCRIPTION:"
    cleaned = cleaned.substring(descIndex).replace(/^DESCRIPTION:\s*:\s*/i, "").replace(/^DESCRIPTION:\s*/i, "");
  }

  // Remove technical noise and trailing script references
  cleaned = cleaned.split('document.addEventListener')[0];
  cleaned = cleaned.split('Avoid FAKE Copies')[0];
  cleaned = cleaned.split('× Avoid FAKE')[0];
  
  // If the string starts with the menu noise, and we didn't find DESCRIPTION, 
  // we try to cut off the known menu prefix
  if (cleaned.includes("4K Movies HDHub4u Home")) {
    const parts = cleaned.split("Search");
    if (parts.length > 1) {
      cleaned = parts[parts.length - 1];
    }
  }

  return cleaned.trim();
};

export default async function MoviePage({ params }: { params: { slug: string } }) {
  const movie = await getMovieDetails(params.slug);
  const synopsis = cleanSynopsis(movie.synopsis);

  const sortedDownloads = [...movie.downloads].sort((a, b) => getQualityRank(a.label) - getQualityRank(b.label));
  const sortedWatch = [...movie.watch].sort((a, b) => getQualityRank(a.label) - getQualityRank(b.label));

  return (
    <div className="flex flex-col gap-10 pb-20 max-w-5xl mx-auto">
      {/* Back Button */}
      <div>
        <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ChevronLeft size={20} /> Back to Home
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center gap-6">
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
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white leading-tight px-4">
            {movie.title}
          </h1>

          <div className="flex flex-wrap justify-center gap-2">
            {movie.qualities.map((q) => (
              <Badge key={q} variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                {q}
              </Badge>
            ))}
          </div>

          {synopsis && (
            <div className="prose prose-invert max-w-none px-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {synopsis}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Episodes Section (For Series) */}
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

      {/* Downloads Section */}
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
              {sortedWatch.map((link, idx) => (
                <div key={idx} className="w-full">
                  <Separator className="bg-white/10" />
                  <Link 
                    href={link.url} 
                    target="_blank"
                    className="flex items-center justify-center py-5 hover:bg-white/5 transition-colors group"
                  >
                    <span className={cn("flex items-center gap-2 transition-transform group-hover:scale-105", getQualityStyles(link.label))}>
                      <Play size={16} fill="currentColor" />
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

      {/* Trailer Section */}
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

      {/* Screenshots Section */}
      {movie.screenshots && movie.screenshots.length > 0 && (
        <section className="space-y-6 px-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 justify-center md:justify-start">
            Screenshots
          </h2>
          <div className="flex flex-col gap-8">
            {movie.screenshots.map((s, idx) => (
              <div key={idx} className="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-muted group cursor-zoom-in shadow-2xl">
                <Image
                  src={s.raw_full || s.raw_thumb}
                  alt={`Screenshot ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

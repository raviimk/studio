import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, Zap, Languages, FileText, Download, Star, Users, Clapperboard, Film, LayoutGrid, Layers } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import placeholders from "@/app/lib/placeholder-images.json";
import { TrailerPlayer } from "@/components/TrailerPlayer";

export const dynamic = 'force-dynamic';

interface LinkItem {
  label: string;
  url: string;
  host: string;
  res?: string;
  size?: string;
  episode?: number;
  quality?: string;
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
  posterBig?: string | null;
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
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch movie details");
  const data = await res.json();
  if (!data || !data.title) notFound();
  
  const sanitize = (str: string) => (str || "").replace(/HDHub4u/gi, "RV MOVIES");
  
  return {
    ...data,
    title: sanitize(data.title),
    description: sanitize(data.description),
    downloads: (data.downloads || []).map((d: any) => ({ ...d, label: sanitize(d.label) })),
    watch: (data.watch || []).map((w: any) => ({ ...w, label: sanitize(w.label) }))
  };
}

const getQualityStyles = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('4k') || l.includes('2160')) return "text-blue-500";
  if (l.includes('1080')) return "text-blue-400";
  if (l.includes('720')) return "text-sky-400";
  if (l.includes('480')) return "text-yellow-400";
  return "text-foreground";
};

const getQualityRank = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('4k') || l.includes('2160')) return 4;
  if (l.includes('1080')) return 3;
  if (l.includes('720')) return 2;
  if (l.includes('480')) return 1;
  return 0;
};

const parseLinkLabel = (label: string) => {
  const match = label.match(/(.*?)(\[.*?\])/);
  if (match) {
    const s = match[2].trim().replace(/[\[\]]/g, '');
    return { name: match[1].trim(), size: s };
  }
  return { name: label, size: "" };
};

const normalizeProxyUrl = (url: string | null | undefined, base: string) => {
  if (!url) return placeholders.moviePoster;
  if (url.startsWith('http')) return url;
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

export default async function MoviePage({ params }: { params: { slug: string } }) {
  const movie = await getMovieDetails(params.slug);

  const posterSrc = normalizeProxyUrl(movie.posterBig || movie.poster, API_BASE);

  // Separate single episode links from pack/full downloads
  const singleEpisodeLinks = (movie.downloads || []).filter(link => 
    link.episode !== undefined || /EP\d+/i.test(link.label)
  );
  
  const packDownloads = (movie.downloads || []).filter(link => 
    !singleEpisodeLinks.some(sel => sel.url === link.url)
  ).sort((a, b) => getQualityRank(b.label) - getQualityRank(a.label));

  // Group single episodes: Episode # -> Quality -> Host -> URL
  const episodeGroups: Record<number, Record<string, Record<string, string>>> = {};
  
  singleEpisodeLinks.forEach(link => {
    let epNum = link.episode;
    if (epNum === undefined) {
      const match = link.label.match(/EP(\d+)/i);
      if (match) epNum = parseInt(match[1]);
    }
    if (epNum === undefined) return;

    let q = link.quality;
    if (!q) {
      const match = link.label.match(/(\d+p)/i);
      if (match) q = match[1];
    }
    q = q || "Unknown Quality";

    let hostName = link.host;
    if (hostName.toLowerCase().includes('cloud')) hostName = 'Drive';
    if (hostName.toLowerCase().includes('cdn') || hostName.toLowerCase().includes('wiki') || hostName.toLowerCase().includes('instant')) hostName = 'Instant';

    if (!episodeGroups[epNum]) episodeGroups[epNum] = {};
    if (!episodeGroups[epNum][q]) episodeGroups[epNum][q] = {};
    episodeGroups[epNum][q][hostName] = link.url;
  });

  const episodeNumbers = Object.keys(episodeGroups).map(Number).sort((a, b) => a - b);

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

      {packDownloads.length > 0 && (
        <section className="bg-red-950/20 border-y border-red-500/10 py-10">
          <div className="flex flex-col items-center">
            <h2 className="text-red-500 font-black text-sm md:text-lg tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
              <Download size={24} /> DOWNLOAD LINKS
            </h2>
            
            <div className="w-full flex flex-col max-w-4xl mx-auto px-4 gap-4">
              {packDownloads.map((link, idx) => {
                const { name, size: parsedSize } = parseLinkLabel(link.label);
                const displaySize = link.size || parsedSize;
                return (
                  <Link 
                    key={idx}
                    href={link.url} 
                    target="_blank"
                    className="flex items-center justify-between py-4 px-6 bg-white/5 hover:bg-white/10 transition-all group rounded-2xl border border-white/5 hover:border-red-500/30"
                  >
                    <div className="flex flex-col gap-0.5 transition-transform group-hover:scale-105">
                      <span className={cn("text-base md:text-xl font-black flex items-center gap-2", getQualityStyles(name))}>
                        {name.toLowerCase().includes('480p') && <Zap size={18} fill="currentColor" />}
                        {name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-red-400 transition-colors tracking-[0.2em]">
                      {displaySize || link.host}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {episodeNumbers.length > 0 && (
        <section className="bg-blue-950/20 border-y border-blue-500/10 py-10">
          <div className="flex flex-col items-center">
            <h2 className="text-blue-400 font-black text-sm md:text-lg tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
              <Layers size={24} /> : Single Episode x264 Links :
            </h2>
            
            <div className="w-full flex flex-col max-w-4xl mx-auto px-4 gap-6">
              {episodeNumbers.map((epNum) => (
                <div key={epNum} className="flex flex-col gap-3 bg-white/5 p-6 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                    EPiSODE {epNum}
                  </h3>
                  <div className="flex flex-col gap-2 pl-2">
                    {Object.entries(episodeGroups[epNum]).map(([quality, hosts]) => (
                      <div key={quality} className="flex items-center gap-2">
                        <span className={cn("font-bold text-sm min-w-[60px]", getQualityStyles(quality))}>{quality}</span>
                        <span className="text-muted-foreground opacity-50">–</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(hosts).map(([host, url], hIdx, arr) => (
                            <div key={host} className="flex items-center">
                              <Link 
                                href={url} 
                                target="_blank"
                                className="text-sm font-bold text-white hover:text-blue-400 hover:underline transition-colors"
                              >
                                {host}
                              </Link>
                              {hIdx < arr.length - 1 && <span className="mx-2 text-muted-foreground opacity-30">|</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
                    <span className={cn("flex items-center gap-3 transition-transform group-hover:scale-105 font-bold text-white uppercase text-sm md:text-base")}>
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

      {movie.trailer && (
        <TrailerPlayer embedUrl={movie.trailer.embed} title={movie.title} />
      )}

      {movie.screenshots && movie.screenshots.length > 0 && (
        <section className="space-y-6 px-4">
          <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
            <LayoutGrid size={24} className="text-yellow-400" /> SCREENSHOTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movie.screenshots.map((s, idx) => {
              const imageUrl = normalizeProxyUrl(s, API_BASE);

              return (
                <div key={idx} className="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-muted group shadow-xl">
                  <Image
                    src={imageUrl}
                    alt={`Screenshot ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                    data-ai-hint="movie screenshot"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">Screenshot {idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

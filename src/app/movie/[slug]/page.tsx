import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Play, Zap, Languages, FileText, Download, Star, Users, Clapperboard, Film, LayoutGrid, Layers } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import placeholders from "@/app/lib/placeholder-images.json";
import { TrailerPlayer } from "@/components/TrailerPlayer";
import { BackButton } from "@/components/BackButton";
import Link from "next/link";

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
  
  let finalUrl = url;

  // 1. Swap catimages.co to catimages.org for high resolution
  if (finalUrl.includes('catimages.co')) {
    finalUrl = finalUrl.replace('catimages.co', 'catimages.org');
  }

  // 2. Handle relative paths (e.g., /img?u=...)
  if (!finalUrl.startsWith('http')) {
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
    return `${cleanBase}${cleanPath}`;
  }

  // 3. Robust Fallback: If it's a direct URL to a known external host (like myimg.bid),
  // wrap it in the proxy to bypass potential blocks/403s.
  const externalHosts = ['myimg.bid', 'catimages', 'postimg', 'image.tmdb.org'];
  const needsProxy = externalHosts.some(host => finalUrl.includes(host));
  
  if (needsProxy && !finalUrl.includes('?u=')) {
    const cleanBase = base.replace(/\/+$/, '');
    return `${cleanBase}/img?u=${encodeURIComponent(finalUrl)}`;
  }
  
  return finalUrl;
};

export default async function MoviePage({ 
  params,
  searchParams
}: { 
  params: { slug: string },
  searchParams: { poster?: string }
}) {
  const movie = await getMovieDetails(params.slug);

  // Fallback to high-quality poster from search results if API's poster is missing
  let posterSrc = (movie.posterBig || movie.poster) 
    ? normalizeProxyUrl(movie.posterBig || movie.poster, API_BASE)
    : (searchParams.poster || placeholders.moviePoster);

  const singleEpisodeLinks = (movie.downloads || []).filter(link => 
    link.episode !== undefined || /EP\d+/i.test(link.label)
  );
  
  const packDownloads = (movie.downloads || []).filter(link => 
    !singleEpisodeLinks.some(sel => sel.url === link.url)
  ).sort((a, b) => getQualityRank(b.label) - getQualityRank(a.label));

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
        <BackButton />
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
              priority
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
        <section className="bg-blue-950/20 border-y border-blue-500/10 py-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="flex flex-col items-center relative z-10">
            <h2 className="text-blue-400 font-black text-sm md:text-lg tracking-[0.3em] uppercase mb-12 flex flex-col items-center gap-2">
              <Layers size={28} className="animate-pulse" />
              <span className="text-center">: Single Episode x264 Links :</span>
            </h2>
            
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto px-4 gap-6">
              {episodeNumbers.map((epNum) => (
                <div 
                  key={epNum} 
                  className="flex flex-col items-center gap-3 bg-white/5 p-5 rounded-[2rem] border border-white/5 hover:border-blue-500/40 transition-all duration-500 group hover:bg-white/[0.07] hover:-translate-y-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-500"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-black text-blue-400 tracking-[0.4em] uppercase opacity-60">Season 01</span>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic group-hover:scale-110 transition-transform duration-500">
                      EP {epNum}
                    </h3>
                  </div>
                  
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

                  <div className="flex flex-col gap-3 w-full">
                    {Object.entries(episodeGroups[epNum]).map(([quality, hosts]) => (
                      <div key={quality} className="flex flex-col items-center gap-1.5">
                        <Badge variant="outline" className={cn("border-none text-[10px] font-black tracking-widest px-0 uppercase", getQualityStyles(quality))}>
                          {quality}
                        </Badge>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {Object.entries(hosts).map(([host, url]) => (
                            <div key={host} className="flex items-center">
                              <Link 
                                href={url} 
                                target="_blank"
                                className="text-xs font-black text-white/80 hover:text-blue-400 hover:scale-105 active:scale-95 transition-all py-1 px-3 bg-white/5 rounded-full border border-white/5 hover:border-blue-500/30"
                              >
                                {host}
                              </Link>
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
        <section className="bg-emerald-950/20 border-y border-emerald-500/10 py-10 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

          <div className="flex flex-col items-center relative z-10">
            <h2 className="text-emerald-400 font-black text-xs md:text-sm tracking-[0.3em] uppercase mb-8 flex items-center gap-3">
              <Play size={18} fill="currentColor" className="text-emerald-400" />
              <span>WATCH ONLINE</span>
            </h2>
            
            <div className="w-full flex flex-col max-w-2xl mx-auto px-4 gap-3">
              {movie.watch.map((link, idx) => {
                const label = (link.label.toUpperCase() === "WATCH" || link.label.toUpperCase() === "WATCH ONLINE") && movie.watch.length > 1 
                  ? `STREAM PLAYER ${idx + 1}` 
                  : link.label.replace(/HDHub4u/gi, "RV MOVIES");

                return (
                  <Link 
                    key={idx}
                    href={link.url} 
                    target="_blank"
                    className="flex items-center gap-4 py-3 px-5 bg-white/5 hover:bg-emerald-500/10 transition-all group rounded-2xl border border-white/5 hover:border-emerald-500/40 active:scale-[0.98] relative overflow-hidden backdrop-blur-md"
                  >
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/5 opacity-40 group-hover:animate-[shimmer_2.5s_infinite]" />

                    <div className="bg-emerald-500/20 p-2.5 rounded-full group-hover:bg-emerald-500/30 transition-all group-hover:scale-110 shrink-0">
                      <Play size={18} fill="currentColor" className="text-emerald-400 animate-play-pulse" />
                    </div>
                    <span className="font-black text-white uppercase tracking-widest text-xs md:text-sm transition-all group-hover:text-emerald-300 truncate">
                      {label}
                    </span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap size={14} className="text-emerald-400 animate-pulse" />
                    </div>
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
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

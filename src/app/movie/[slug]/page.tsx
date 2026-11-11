import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Download, ExternalLink, ChevronLeft, Tv } from "lucide-react";
import { notFound } from "next/navigation";

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
  other: LinkItem[];
  synopsis: string;
}

async function getMovieDetails(slug: string): Promise<MovieDetail> {
  // Appending trailing slash as per API requirement mentioned
  const res = await fetch(`https://rvmovies.deathmaniya.workers.dev/api/movie?u=${slug}/`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error("Failed to fetch movie details");
  const data = await res.json();
  if (!data.ok) notFound();
  return data;
}

export default async function MoviePage({ params }: { params: { slug: string } }) {
  const movie = await getMovieDetails(params.slug);

  return (
    <div className="flex flex-col gap-12 pb-20">
      {/* Back Button */}
      <div>
        <Button variant="ghost" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ChevronLeft size={20} /> Back to Movies
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="grid lg:grid-cols-[350px,1fr] gap-10">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border bg-muted shadow-2xl">
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            {movie.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {movie.qualities.map((q) => (
              <Badge key={q} variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                {q}
              </Badge>
            ))}
          </div>

          <div className="prose prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-2">Synopsis</h3>
            <p className="text-muted-foreground leading-relaxed">
              {movie.synopsis.split('document.addEventListener')[0].substring(0, 500)}...
            </p>
          </div>
        </div>
      </div>

      {/* Trailer Section */}
      {movie.trailer && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Play size={24} className="text-primary" /> Official Trailer
          </h2>
          <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border bg-black shadow-lg">
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
      {movie.screenshots.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Screenshots</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {movie.screenshots.map((s, idx) => (
              <div key={idx} className="relative aspect-video overflow-hidden rounded-xl border bg-muted group cursor-zoom-in">
                <Image
                  src={s.raw_thumb}
                  alt={`Screenshot ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Download & Watch Section */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* Watch Online */}
        {movie.watch.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Tv size={24} className="text-green-500" /> Watch Online
            </h2>
            <div className="flex flex-col gap-3">
              {movie.watch.map((link, idx) => (
                <Button key={idx} variant="outline" asChild className="h-14 justify-between bg-zinc-900/50 hover:bg-zinc-800 transition-all border-zinc-800">
                  <Link href={link.url} target="_blank">
                    <span className="flex items-center gap-3">
                      <span className="bg-green-500/20 text-green-500 p-2 rounded-lg">
                        <Play size={18} fill="currentColor" />
                      </span>
                      {link.label}
                    </span>
                    <ExternalLink size={16} className="text-muted-foreground" />
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* Downloads */}
        {movie.downloads.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Download size={24} className="text-primary" /> Download Links
            </h2>
            <div className="flex flex-col gap-3">
              {movie.downloads.map((link, idx) => (
                <Button key={idx} asChild className="h-14 justify-between bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-all">
                  <Link href={link.url} target="_blank">
                    <span className="flex items-center gap-3">
                      <span className="bg-primary/20 p-2 rounded-lg">
                        <Download size={18} />
                      </span>
                      {link.label}
                    </span>
                    <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px]">
                      {link.host}
                    </Badge>
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

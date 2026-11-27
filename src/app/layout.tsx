import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Suspense } from "react";
import { ShieldCheck, Zap } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RV MOVIES - Download Latest Movies",
  description: "Download high quality movies in 4K, 1080p, 720p and 480p.",
};

const STATUS_API = "https://rvmovies.deathmaniya.workers.dev/api/base";

async function getApiStatus() {
  try {
    const res = await fetch(STATUS_API, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiStatus = await getApiStatus();
  const version = apiStatus?.version || "v22";
  const baseShort = apiStatus?.base 
    ? new URL(apiStatus.base).hostname.split('.')[0] 
    : "new17";

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="bg-animation" />
        <div className="flex min-h-screen flex-col relative z-10">
          <Suspense fallback={<div className="h-14" />}>
            <Header />
          </Suspense>
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-white/5 py-16 text-center backdrop-blur-md relative overflow-hidden group">
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="container mx-auto px-4 flex flex-col items-center gap-8 relative z-10">
              {/* Slogan section */}
              <div className="flex flex-col gap-4 items-center">
                <p className="text-3xl md:text-4xl font-black italic tracking-tighter text-white animate-pulse">
                  STAY CINEMATIC. 🍿
                </p>
                <div className="h-1 w-20 bg-primary rounded-full" />
                
                {/* System Status in Footer */}
                <div className="flex flex-col gap-3 items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-80">
                    Your High-Speed Cinema Getaway
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black tracking-widest text-primary/80">
                      <ShieldCheck size={12} /> {version}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black tracking-widest text-blue-400/80">
                      <Zap size={12} /> {baseShort}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Creator info */}
              <div className="flex flex-col gap-1">
                <p className="text-base font-bold text-muted-foreground">
                  Crafted with <span className="text-red-500 inline-block hover:animate-bounce">❤️</span> by <span className="text-primary font-black tracking-tight cursor-default">RAVII</span> 
                  <span className="mx-3 opacity-20">|</span> 
                  aka <span className="text-white font-black italic tracking-tighter hover:text-primary transition-colors">VEERU</span>
                </p>
                <p className="text-xs font-medium text-muted-foreground/40 italic">
                  © 2026 RV MOVIES. No rights reserved, just pure cinema vibes.
                </p>
              </div>

              {/* Support pill */}
              <a 
                href="mailto:pvtkrv@gmail.com" 
                className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black tracking-widest text-muted-foreground hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-500 group/mail"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                HIT US UP: PVTKRV@GMAIL.COM
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

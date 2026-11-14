
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
        <AlertTriangle size={80} className="text-primary relative z-10 animate-bounce" />
      </div>
      
      <div className="flex flex-col gap-2 relative z-10">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
          Opps! Something Glitched
        </h2>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          Our cinema server hit a small bump. Don't worry, the popcorn is still warm! Try refreshing or heading back home.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
        <Button 
          onClick={() => reset()}
          size="lg"
          className="rounded-full px-8 font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 transition-all active:scale-95"
        >
          <RefreshCcw size={18} /> Try Again
        </Button>
        
        <Button 
          variant="outline"
          size="lg"
          asChild
          className="rounded-full px-8 font-black uppercase tracking-widest gap-2 border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
        >
          <Link href="/">
            <Home size={18} /> Back Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

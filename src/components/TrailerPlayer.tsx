'use client';

import { useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';

interface TrailerPlayerProps {
  embedUrl: string;
  title: string;
}

export function TrailerPlayer({ embedUrl, title }: TrailerPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    // Intersection Observer to detect when the trailer is visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldPlay(true);
        }
      },
      { 
        threshold: 0.3, // Trigger when 30% of the section is visible
        rootMargin: '0px' 
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Update URL to include autoplay and mute parameters when visible
  // Mute is required by browsers to allow autoplay
  const videoSrc = shouldPlay 
    ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1` 
    : embedUrl;

  return (
    <section ref={containerRef} className="px-4 mt-8 space-y-6">
      <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
        <Film size={24} className="text-primary" /> Official Trailer
      </h2>
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
        <iframe
          src={videoSrc}
          title={`${title} Trailer`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

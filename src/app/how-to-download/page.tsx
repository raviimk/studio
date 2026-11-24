'use client';

import { BackButton } from "@/components/BackButton";
import { PlayCircle, Info, CheckCircle2 } from "lucide-react";

export default function HowToDownloadPage() {
  return (
    <div className="flex flex-col gap-10 pb-20 max-w-4xl mx-auto px-4">
      <div className="pt-4">
        <BackButton />
      </div>

      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic flex items-center justify-center gap-4">
            <PlayCircle size={40} className="text-primary animate-pulse" />
            : How to Download :
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
        </div>
        <p className="text-muted-foreground font-medium max-w-xl mx-auto">
          Follow the steps in the video below to learn how to grab your favorite movies in high quality without any hassle.
        </p>
      </div>

      <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-black/40 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <video 
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          playsInline
        >
          {/* Note: In Next.js, static files should be in the public/ folder to be accessible via URL */}
          <source src="/ttr.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {[
          { icon: <Info size={24} />, title: "CHOOSE LINK", desc: "Select from 4K, 1080p, or 720p mirrors." },
          { icon: <PlayCircle size={24} />, title: "STREAM OR DL", desc: "Instantly stream online or download to device." },
          { icon: <CheckCircle2 size={24} />, title: "ENJOY CINEMA", desc: "High speed links with zero buffering." }
        ].map((step, idx) => (
          <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:border-primary/30 transition-all group flex flex-col items-center text-center gap-3">
            <div className="text-primary group-hover:scale-110 transition-transform">
              {step.icon}
            </div>
            <h3 className="font-black text-sm tracking-widest uppercase">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl flex items-center gap-4">
        <div className="bg-primary p-3 rounded-full shrink-0">
          <Info size={20} className="text-white" />
        </div>
        <p className="text-xs md:text-sm font-medium text-white/80 leading-relaxed">
          <span className="font-black text-primary block mb-1">PRO TIP:</span>
          Use a download manager for the fastest experience and to resume interrupted downloads anytime.
        </p>
      </div>
    </div>
  );
}

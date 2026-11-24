'use client';

import { BackButton } from "@/components/BackButton";
import { PlayCircle, Info, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

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
        <p className="text-muted-foreground font-medium max-w-xl mx-auto italic">
          "Follow the steps in the video below to learn how to grab your favorite movies in high quality without any hassle."
        </p>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-black/40 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <video 
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          playsInline
          preload="auto"
        >
          {/* 
            IMPORTANT: For this to work, the file 'ttr.mp4' MUST be placed 
            inside the 'public/' directory of your project. 
          */}
          <source src="/ttr.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay hint if video fails to load */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
           <PlayCircle size={80} className="text-white/20" />
        </div>
      </div>

      {/* Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {[
          { icon: <Zap size={24} />, title: "1. CHOOSE LINK", desc: "Select from 4K, 1080p, or 720p mirrors based on your internet speed." },
          { icon: <ShieldCheck size={24} />, title: "2. VERIFY", desc: "Complete the quick verification if prompted to unlock high-speed mirrors." },
          { icon: <PlayCircle size={24} />, title: "3. ENJOY", desc: "Instantly stream online or download to your device for offline viewing." }
        ].map((step, idx) => (
          <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:border-primary/30 transition-all group flex flex-col items-center text-center gap-3">
            <div className="text-primary group-hover:scale-110 transition-transform p-3 bg-primary/10 rounded-2xl">
              {step.icon}
            </div>
            <h3 className="font-black text-sm tracking-widest uppercase">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
      
      {/* Pro Tip Section */}
      <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="bg-primary p-4 rounded-3xl shadow-xl shadow-primary/20 shrink-0 transform group-hover:rotate-12 transition-transform">
          <Info size={28} className="text-white" />
        </div>
        
        <div className="flex flex-col gap-2 relative z-10">
          <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed">
            <span className="font-black text-primary block mb-1 text-xs tracking-widest uppercase">PRO TIP: FASTEST DOWNLOADS</span>
            For the fastest experience and the ability to resume interrupted downloads, we highly recommend using a <span className="text-primary font-bold">Download Manager</span> (like IDM or ADM).
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
            <CheckCircle2 size={12} /> High Speed Links Verified
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.3em] opacity-40">
        RV MOVIES Support: pvtkrv@gmail.com
      </p>
    </div>
  );
}

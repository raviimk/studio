'use client';

import { BackButton } from "@/components/BackButton";
import { PlayCircle, Info, CheckCircle2, ShieldCheck, Zap, ArrowRightCircle } from "lucide-react";

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
          "Master the art of grabbing high-speed mirrors. Watch the short guide below to start your cinematic journey."
        </p>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-black/40 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/*
          IMPORTANT: The video file 'ttr.mp4' MUST be in the 'public/' folder.
          Accessible via '/ttr.mp4'
        */}
        <video 
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          playsInline
          preload="auto"
        >
          <source src="/ttr.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay hint if video is missing */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 text-center p-6">
           <PlayCircle size={60} className="text-primary mb-4" />
           <p className="text-xs font-black uppercase tracking-widest">Tutorial Mode Active</p>
        </div>
      </div>

      {/* Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {[
          { icon: <Zap size={24} />, title: "1. PICK LINK", desc: "Select your quality (4K, 1080p, 720p). 4K requires a faster connection." },
          { icon: <ShieldCheck size={24} />, title: "2. VERIFY", desc: "If prompted, complete the quick verification to unlock dedicated servers." },
          { icon: <ArrowRightCircle size={24} />, title: "3. STREAM/SAVE", desc: "Enjoy instant playback or save it to your device for offline viewing." }
        ].map((step, idx) => (
          <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-primary/30 transition-all group flex flex-col items-center text-center gap-4 hover:bg-white/[0.07]">
            <div className="text-primary group-hover:scale-125 transition-transform p-4 bg-primary/10 rounded-2xl">
              {step.icon}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-black text-sm tracking-widest uppercase text-white">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pro Tip Section */}
      <div className="bg-primary/10 border border-primary/20 p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="bg-primary p-5 rounded-[2rem] shadow-2xl shadow-primary/30 shrink-0 transform group-hover:rotate-[360deg] transition-transform duration-700">
          <Info size={32} className="text-white" />
        </div>
        
        <div className="flex flex-col gap-3 relative z-10">
          <h4 className="font-black text-primary text-xs tracking-[0.3em] uppercase">PRO TIP: LIGHTNING SPEEDS</h4>
          <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed">
            For the best experience and the ability to resume interrupted downloads, we highly recommend using a <span className="text-primary font-bold underline decoration-primary/30 underline-offset-4">Download Manager</span> like IDM (PC) or ADM (Mobile).
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
            <CheckCircle2 size={14} /> High Speed Links Verified & Active
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 opacity-40">
        <div className="h-px w-20 bg-white/20" />
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.5em]">
          RV MOVIES Support: pvtkrv@gmail.com
        </p>
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LaserLot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, History, Diamond, User, Calendar, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from './ui/badge';

interface LotDetailPopupProps {
  lot: LaserLot | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DiamondRain = () => (
  <div className="absolute inset-0 overflow-hidden">
    {Array.from({ length: 20 }).map((_, i) => (
      <Diamond
        key={i}
        className="absolute text-white/10"
        style={{
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 15 + 5}px`,
          height: `${Math.random() * 15 + 5}px`,
          animation: `fall ${Math.random() * 5 + 5}s linear ${Math.random() * 5}s infinite`,
          '--x-start': `${Math.random() * 40 - 20}vw`,
          '--x-end': `${Math.random() * 40 - 20}vw`,
        } as React.CSSProperties}
      />
    ))}
  </div>
);

const LaserGrid = () => (
    <div className="absolute inset-0 overflow-hidden">
        <div 
            className="absolute -inset-1/2 bg-grid"
            style={{
                backgroundImage: 'linear-gradient(to right, hsl(var(--destructive)/0.2) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--destructive)/0.2) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }}
        />
        <div 
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-destructive/60 to-transparent" 
            style={{ filter: 'blur(50px)'}}
        />
        <div 
            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-destructive/30 via-transparent to-destructive/30"
        />
        <div className="absolute top-0 left-0 h-full w-[2px] bg-destructive/80 shadow-[0_0_15px_2px_hsl(var(--destructive))] animate-[scan-light_4s_ease-in-out_infinite]" />
    </div>
);


export default function LotDetailPopup({ lot, isOpen, onOpenChange }: LotDetailPopupProps) {
  if (!lot) return null;

  const isReturned = lot.isReturned;
  const statusIcon = isReturned ? <CheckCircle2 className="h-6 w-6 text-green-400" /> : <History className="h-6 w-6 text-yellow-400" />;
  const statusText = isReturned ? 'Returned' : 'Running';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
          "max-w-md p-0 border-none rounded-2xl overflow-hidden",
          "bg-background/60 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-2xl",
          "transition-all duration-500 ease-in-out",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-90",
          "relative grainy-bg"
      )}>
        {isReturned ? <LaserGrid/> : <DiamondRain/>}

        <div className="relative z-10 p-8 text-white space-y-6">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                    {statusIcon}
                    <h2 className="text-2xl font-bold tracking-wider uppercase">{statusText}</h2>
                </div>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">Lot Number</Badge>
                <p className="text-5xl font-bold font-mono text-shadow-lg" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>{lot.lotNumber}</p>
            </div>
            
            <div className="space-y-4 text-lg">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-white/70"><Hash size={18}/> Kapan</span>
                    <span className="font-semibold">{lot.kapanNumber}</span>
                </div>
                 <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-white/70"><Calendar size={18}/> Entry Date</span>
                    <span className="font-semibold">{format(new Date(lot.entryDate), 'PP')}</span>
                </div>
                {isReturned && lot.returnDate && (
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-white/70"><Calendar size={18}/> Return Date</span>
                        <span className="font-semibold">{format(new Date(lot.returnDate), 'PP')}</span>
                    </div>
                )}
                {isReturned && lot.returnedBy && (
                     <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-white/70"><User size={18}/> Returned By</span>
                        <span className="font-semibold">{lot.returnedBy}</span>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

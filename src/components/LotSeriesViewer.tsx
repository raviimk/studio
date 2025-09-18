
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { Check, Circle, Dot } from 'lucide-react';
import { LaserLot } from '@/lib/types';

type LotStatus = 'completed' | 'current' | 'next' | 'future' | 'missing' | 'cutting';

interface LotSeriesViewerProps {
    series: number[];
    completedLots: Set<number>;
    currentLot: number | null | undefined;
    nextLot: number | null | undefined;
    lastCompletedLot: number | null;
    onLotClick: (lotNumber: number) => void;
}

const DiamondIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}>
        <g className="diamond-piece-1"><path d="M12 2L3 9.75L12 22L21 9.75L12 2ZM12 4.53L18.7 10.5H5.3L12 4.53Z" /></g>
        <g className="diamond-piece-2"><path d="M4.5 10.5L12 20.5L19.5 10.5H4.5Z" /></g>
        <g className="diamond-piece-3"><path d="M12 2L5.3 10.5H18.7L12 2Z"/></g>
    </svg>
);


export default function LotSeriesViewer({ series, completedLots, currentLot, nextLot, lastCompletedLot, onLotClick }: LotSeriesViewerProps) {
    const [api, setApi] = useState<CarouselApi>()
    const [isAnimating, setIsAnimating] = useState<number | null>(null);

    useEffect(() => {
        if (!api) return;

        if (isAnimating) {
            const animatingIndex = series.indexOf(isAnimating);
            if (animatingIndex !== -1) {
                api.scrollTo(animatingIndex, true);
                return;
            }
        }

        const currentLotIndex = currentLot ? series.indexOf(currentLot) : -1;
        if (currentLotIndex !== -1) {
            api.scrollTo(currentLotIndex, true);
        } else if (nextLot) {
            const nextLotIndex = series.indexOf(nextLot);
            if (nextLotIndex !== -1 && api.selectedScrollSnap() !== nextLotIndex) {
                api.scrollTo(nextLotIndex, false);
            }
        }
    }, [api, currentLot, nextLot, series, isAnimating]);

    useEffect(() => {
        if (lastCompletedLot) {
            setIsAnimating(lastCompletedLot);
            const timer = setTimeout(() => {
                setIsAnimating(null);
            }, 2500); 
            return () => clearTimeout(timer);
        }
    }, [lastCompletedLot]);


    if (series.length === 0) {
        return <p className="text-sm text-center text-muted-foreground">Enter a Lot number to see the series for this month.</p>
    }

    const getLotStatus = (lotNumber: number): LotStatus => {
        if (lotNumber === isAnimating) return 'cutting';
        if (lotNumber === currentLot) return 'current';
        if (completedLots.has(lotNumber)) return 'completed';
        if (lotNumber === nextLot) return 'next';
        if (lotNumber < (nextLot || 0)) return 'missing';
        return 'future';
    };

    const getStatusIcon = (status: LotStatus) => {
        switch (status) {
            case 'completed': return <Check size={16} className="text-green-500" />;
            case 'current': return <Dot size={32} className="text-green-400 -m-2 animate-pulse" />;
            case 'next': return <Circle size={10} fill="currentColor" className="text-muted-foreground/50" />;
            default: return null;
        }
    }
    
    const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!api) return;
        if (e.deltaY > 0) {
            api.scrollNext();
        } else if (e.deltaY < 0) {
            api.scrollPrev();
        }
    }

    return (
        <Carousel
            opts={{
                align: "center",
                dragFree: true,
            }}
            setApi={setApi}
            className="w-full"
            onWheel={handleWheelScroll}
        >
            <CarouselContent>
                {series.map((lot) => {
                    const status = getLotStatus(lot);
                    return (
                        <CarouselItem key={lot} className="basis-auto">
                           <div onClick={() => status !== 'future' && status !== 'missing' && onLotClick(lot)}
                                className={cn(
                                "relative overflow-hidden flex items-center justify-center gap-1.5 h-10 px-4 rounded-full border transition-all duration-300",
                                (status === 'completed' || status === 'current' || status === 'next' || status === 'cutting') && 'cursor-pointer',
                                status === 'cutting' && "bg-primary text-primary-foreground font-bold shadow-lg ring-2 ring-primary/50 animate-laser-cut",
                                status === 'completed' && "bg-green-100 dark:bg-green-900/30 border-green-500/50 text-green-700 dark:text-green-300",
                                status === 'current' && "bg-primary text-primary-foreground font-bold shadow-lg ring-2 ring-primary/50",
                                status === 'next' && "bg-muted text-muted-foreground",
                                status === 'missing' && "bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-500/50 border-dashed text-yellow-600 dark:text-yellow-400",
                                status === 'future' && "bg-muted/50 text-muted-foreground/70"
                           )}>
                                {status === 'cutting' ? (
                                    <>
                                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/80 laser-beam" style={{boxShadow: '0 0 5px red'}}/>
                                        <DiamondIcon className="absolute w-6 h-6 text-white/90 diamond-main" />
                                    </>
                                ) : getStatusIcon(status)}
                                <span className={cn("font-mono text-sm font-medium transition-opacity", status === 'cutting' && 'opacity-0')}>
                                    {lot}
                                </span>
                           </div>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
        </Carousel>
    );
}


'use client';
import React, { useEffect, useRef } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { Check, Circle, Dot } from 'lucide-react';

type LotStatus = 'completed' | 'current' | 'next' | 'future' | 'missing';

interface LotSeriesViewerProps {
    series: number[];
    completedLots: Set<number>;
    currentLot: number | null | undefined;
    nextLot: number | null | undefined;
}

export default function LotSeriesViewer({ series, completedLots, currentLot, nextLot }: LotSeriesViewerProps) {
    const [api, setApi] = React.useState<CarouselApi>()
 
    useEffect(() => {
        if (!api) return;

        const currentLotIndex = currentLot ? series.indexOf(currentLot) : -1;
        if (currentLotIndex !== -1) {
            api.scrollTo(currentLotIndex, false); // Animate to current
        } else if (nextLot) {
            const nextLotIndex = series.indexOf(nextLot);
            if (nextLotIndex !== -1) {
                api.scrollTo(nextLotIndex, false); // Animate to next
            }
        }
    }, [api, currentLot, nextLot, series]);


    if (series.length === 0) {
        return <p className="text-sm text-center text-muted-foreground">Enter a Kapan number to see the lot series.</p>
    }

    const getLotStatus = (lotNumber: number): LotStatus => {
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

    return (
        <Carousel
            opts={{
                align: "center",
                dragFree: true,
            }}
            setApi={setApi}
            className="w-full"
        >
            <CarouselContent>
                {series.map((lot) => {
                    const status = getLotStatus(lot);
                    return (
                        <CarouselItem key={lot} className="basis-auto">
                           <div className={cn(
                                "flex items-center justify-center gap-1.5 h-10 px-4 rounded-full border transition-all duration-300",
                                status === 'completed' && "bg-green-100 dark:bg-green-900/30 border-green-500/50 text-green-700 dark:text-green-300",
                                status === 'current' && "bg-primary text-primary-foreground font-bold shadow-lg ring-2 ring-primary/50",
                                status === 'next' && "bg-muted text-muted-foreground",
                                status === 'missing' && "bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-500/50 border-dashed text-yellow-600 dark:text-yellow-400",
                                status === 'future' && "bg-muted/50 text-muted-foreground/70"
                           )}>
                                {getStatusIcon(status)}
                                <span className="font-mono text-sm font-medium">{lot}</span>
                           </div>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
        </Carousel>
    );
}

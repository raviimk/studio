
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
    SARIN_PACKETS_KEY, 
    LASER_LOTS_KEY, 
    FOURP_TECHING_LOTS_KEY, 
    UHDHA_PACKETS_KEY 
} from '@/lib/constants';
import { SarinPacket, LaserLot, FourPLot, UdhdaPacket } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, XCircle, History, CheckCircle2, RotateCw } from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';

type HistoryEvent = {
    step: number;
    module: 'Sarin' | 'Laser' | '4P Teching' | '4P' | 'Udhda';
    lotNumber?: string;
    operator: string;
    action: 'Assigned' | 'Returned';
    timestamp: string;
    notes?: string;
    duration?: string;
};

export default function PacketHistoryPage() {
    const [sarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
    const [laserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
    const [fourPLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
    const [udhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchedPacket, setSearchedPacket] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchedPacket && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [searchedPacket]);

    const packetHistory = useMemo(() => {
        if (!searchedPacket) return [];
        
        let history: HistoryEvent[] = [];

        // Laser Lots
        const laserLot = laserLots.find(lot => lot.scannedPackets?.some(p => p.fullBarcode === searchedPacket));
        if (laserLot) {
            history.push({
                step: 0,
                module: 'Laser',
                lotNumber: laserLot.lotNumber,
                operator: 'System',
                action: 'Assigned',
                timestamp: laserLot.entryDate,
                notes: `Assigned to lot`
            });
            if (laserLot.isReturned && laserLot.returnDate && laserLot.returnedBy) {
                history.push({
                    step: 0,
                    module: 'Laser',
                    lotNumber: laserLot.lotNumber,
                    operator: laserLot.returnedBy,
                    action: 'Returned',
                    timestamp: laserLot.returnDate,
                    duration: formatDistance(new Date(laserLot.returnDate), new Date(laserLot.entryDate))
                });
            }
        }
        
        // Udhda Packets
        const udhdhaPacket = udhdhaPackets.find(p => p.barcode === searchedPacket);
        if (udhdhaPacket) {
            history.push({
                step: 0,
                module: 'Udhda',
                operator: udhdhaPacket.operator,
                action: 'Assigned',
                timestamp: udhdhaPacket.assignmentTime,
                notes: `Type: ${udhdhaPacket.type}`
            });
            if (udhdhaPacket.isReturned && udhdhaPacket.returnTime) {
                history.push({
                    step: 0,
                    module: 'Udhda',
                    operator: udhdhaPacket.operator,
                    action: 'Returned',
                    timestamp: udhdhaPacket.returnTime,
                    duration: formatDistance(new Date(udhdhaPacket.returnTime), new Date(udhdhaPacket.assignmentTime))
                });
            }
        }
        
        // Note: Sarin & 4P lots don't use individual packet barcodes in the current system.
        // The search is primarily for Laser and Udhda packets.

        return history.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((event, index) => ({...event, step: index + 1}));

    }, [searchedPacket, laserLots, udhdhaPackets]);

    const summary = useMemo(() => {
        if (!packetHistory.length) return null;
        
        const lastEvent = packetHistory[packetHistory.length - 1];
        const isReturned = lastEvent.action === 'Returned';
        const totalDurationMs = packetHistory.reduce((sum, event) => {
            if (event.action === 'Returned' && event.duration) {
                const prevEvent = packetHistory.find(e => e.step === event.step - 1);
                if (prevEvent) {
                    return sum + (new Date(event.timestamp).getTime() - new Date(prevEvent.timestamp).getTime());
                }
            }
            return sum;
        }, 0);
        
        return {
            totalMoves: packetHistory.length,
            totalTime: totalDurationMs > 0 ? formatDistance(0, totalDurationMs) : 'N/A',
            finalStatus: isReturned ? 'Returned' : `Currently in ${lastEvent.module}`,
            isReturned
        };
    }, [packetHistory]);


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchedPacket(searchTerm);
    };

    const handleSearchAgain = () => {
        setSearchedPacket(null);
        setSearchTerm('');
    };
    
    const getModuleBadgeVariant = (module: HistoryEvent['module']) => {
        switch(module) {
            case 'Sarin': return 'default';
            case 'Laser': return 'secondary';
            case '4P':
            case '4P Teching': return 'outline';
            case 'Udhda': return 'destructive';
            default: return 'default';
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
            <PageHeader title="Packet History" description="Trace the complete lifecycle of a packet across all departments." />
            
            {!searchedPacket ? (
                 <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Search for a Packet</CardTitle>
                        <CardDescription>Enter a packet barcode (e.g., from a Laser or Udhda scan) to see its full history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input 
                                placeholder="Enter packet barcode..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Button type="submit" disabled={!searchTerm}>
                                <Search className="mr-2" /> Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div ref={resultsRef} className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">History for: <span className="font-mono text-primary">{searchedPacket}</span></h2>
                        <Button variant="outline" onClick={handleSearchAgain}>
                            <RotateCw className="mr-2" /> Search Again
                        </Button>
                    </div>

                    {packetHistory.length > 0 && summary ? (
                        <>
                            <Card>
                                <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Step</TableHead>
                                                <TableHead>Module</TableHead>
                                                <TableHead>Lot No.</TableHead>
                                                <TableHead>Operator</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Duration</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {packetHistory.map(event => (
                                                <TableRow key={event.step}>
                                                    <TableCell>{event.step}</TableCell>
                                                    <TableCell><Badge variant={getModuleBadgeVariant(event.module)}>{event.module}</Badge></TableCell>
                                                    <TableCell>{event.lotNumber || '–'}</TableCell>
                                                    <TableCell>{event.operator}</TableCell>
                                                    <TableCell>{event.action}</TableCell>
                                                    <TableCell>{format(new Date(event.timestamp), 'PPp')}</TableCell>
                                                    <TableCell>{event.duration || '–'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Moves</p>
                                        <p className="text-2xl font-bold">{summary.totalMoves}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Time in Process</p>
                                        <p className="text-2xl font-bold">{summary.totalTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Final Status</p>
                                        <p className={cn("text-2xl font-bold flex items-center justify-center gap-2", summary.isReturned ? "text-green-600" : "text-amber-600")}>
                                            {summary.isReturned ? <CheckCircle2/> : <History/>}
                                            {summary.finalStatus}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="text-center py-12">
                            <CardContent className="space-y-4">
                                <XCircle className="mx-auto h-12 w-12 text-destructive" />
                                <h3 className="text-xl font-semibold">Packet Not Found</h3>
                                <p className="text-muted-foreground">The packet with barcode "{searchedPacket}" was not found in the system.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

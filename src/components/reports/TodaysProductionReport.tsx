
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isToday, format, parseISO } from 'date-fns';
import {
    SARIN_PACKETS_KEY,
    LASER_LOTS_KEY,
    FOURP_TECHING_LOTS_KEY,
    CHALU_SARIN_PROGRESS_KEY,
} from '@/lib/constants';
import * as T from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

type LaserSummary = {
    operator: string;
    pcs: number;
    date: string;
};

type FourPSummary = {
    operator: string;
    pcs: number;
    date: string;
};

type ChaluProgress = {
    [packetId: string]: number;
}

type SarinReturnSummary = {
    operator: string;
    packets: number;
}

export default function TodaysProductionReport() {
    const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);
    const [laserLots] = useLocalStorage<T.LaserLot[]>(LASER_LOTS_KEY, []);
    const [fourPTechingLots] = useLocalStorage<T.FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
    const [chaluProgress, setChaluProgress] = useLocalStorage<ChaluProgress>(CHALU_SARIN_PROGRESS_KEY, {});

    const { todaysReturnedSarin, todaysChaluSarin } = useMemo(() => {
        const returned: T.SarinPacket[] = [];
        const chalu: T.SarinPacket[] = [];

        sarinPackets.forEach(p => {
            if (p.isReturned && p.returnDate && isToday(parseISO(p.returnDate))) {
                returned.push(p);
            } else if (!p.isReturned) {
                chalu.push(p);
            }
        });
        return { todaysReturnedSarin: returned, todaysChaluSarin: chalu };
    }, [sarinPackets]);

    const handleChaluProgressChange = (packet: T.SarinPacket, value: string) => {
        const count = parseInt(value, 10);
        const validatedCount = isNaN(count) || count < 0 ? 0 : Math.min(count, packet.packetCount);
        
        setChaluProgress(prev => ({
            ...prev,
            [packet.id]: validatedCount
        }));
    };

    const sarinReturnSummary = useMemo((): SarinReturnSummary[] => {
        const summary: Record<string, number> = {};
        todaysReturnedSarin.forEach(p => {
            if (p.returnedBy) {
                summary[p.returnedBy] = (summary[p.returnedBy] || 0) + p.packetCount;
            }
        });
        return Object.entries(summary)
            .map(([operator, packets]) => ({ operator, packets }))
            .sort((a,b) => b.packets - a.packets);
    }, [todaysReturnedSarin]);

    const totalSarinReturnedPackets = useMemo(() => sarinReturnSummary.reduce((sum, item) => sum + item.packets, 0), [sarinReturnSummary]);
    const totalSarinChaluPackets = useMemo(() => Object.values(chaluProgress).reduce((sum, count) => sum + (count || 0), 0), [chaluProgress]);
    const totalSarinProduction = totalSarinReturnedPackets + totalSarinChaluPackets;

    const todaysLaserData = useMemo(() => {
        const todaysEntries = laserLots.filter(l => l.returnDate && isToday(parseISO(l.returnDate)));
        const summary: Record<string, LaserSummary> = {};

        todaysEntries.forEach(l => {
            const operator = l.returnedBy!;
            if (!summary[operator]) {
                summary[operator] = { operator, pcs: 0, date: format(parseISO(l.returnDate!), 'PP') };
            }
            summary[operator].pcs += l.packetCount;
        });
        
        return Object.values(summary);
    }, [laserLots]);
    
    const todays4PData = useMemo(() => {
        const todaysEntries = fourPTechingLots.filter(l => l.fourPOperator && l.returnDate && isToday(parseISO(l.returnDate)));
        const summary: Record<string, FourPSummary> = {};

        todaysEntries.forEach(l => {
            const operator = l.fourPOperator!;
             if (!summary[operator]) {
                summary[operator] = { operator, pcs: 0, date: format(parseISO(l.returnDate!), 'PP') };
            }
            summary[operator].pcs += l.finalPcs;
        });

        return Object.values(summary);
    }, [fourPTechingLots]);

    const totalLaser = useMemo(() => todaysLaserData.reduce((acc, op) => acc + op.pcs, 0), [todaysLaserData]);
    const total4P = useMemo(() => todays4PData.reduce((acc, op) => acc + op.pcs, 0), [todays4PData]);

    const DepartmentCard = ({ title, total, borderColor, children, totalBreakdown }: { title: string, total: number | string, borderColor: string, children: React.ReactNode, totalBreakdown?: string }) => (
        <Card className={cn("overflow-hidden border-t-4", borderColor)}>
            <CardHeader className="flex flex-row items-start justify-between pb-4">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                     <span className={cn("h-3 w-3 rounded-full", borderColor.replace('border-', 'bg-'))}></span>
                     {title}
                </CardTitle>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Today's Production</p>
                    <p className="text-2xl font-bold">{total}</p>
                    {totalBreakdown && <p className="text-xs text-muted-foreground">{totalBreakdown}</p>}
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
             <DepartmentCard 
                title="Sarin Department" 
                total={totalSarinProduction}
                borderColor="border-orange-400"
                totalBreakdown={`Returned: ${totalSarinReturnedPackets} + Chalu: ${totalSarinChaluPackets}`}
            >
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-md mb-2">Production (Returned Lots)</h4>
                         {sarinReturnSummary.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Operator</TableHead>
                                        <TableHead className="text-right">Packets Returned</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sarinReturnSummary.map(op => (
                                        <TableRow key={op.operator}>
                                            <TableCell className="font-medium">{op.operator}</TableCell>
                                            <TableCell className="text-right font-mono">{op.packets}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell>Total Returned</TableCell>
                                        <TableCell className="text-right font-mono">{totalSarinReturnedPackets}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                         ) : <p className="text-sm text-muted-foreground text-center py-4">No lots returned today.</p>}
                    </div>

                    <Separator />

                    <div>
                        <h4 className="font-semibold text-md mb-2">Chalu Lots (In-Progress)</h4>
                         {todaysChaluSarin.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Operator / Lot</TableHead>
                                        <TableHead className="w-[100px]">Total PCS</TableHead>
                                        <TableHead className="w-[150px]">Today's PCS Made</TableHead>
                                        <TableHead className="w-[100px]">Remaining</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {todaysChaluSarin.map(p => {
                                        const todaysPcs = chaluProgress[p.id] || 0;
                                        const remaining = p.packetCount - todaysPcs;
                                        return (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="font-medium">{p.operator}</div>
                                                <div className="text-xs text-muted-foreground">{p.lotNumber} ({format(parseISO(p.date), 'dd/MM')})</div>
                                            </TableCell>
                                            <TableCell className="font-mono text-center">{p.packetCount}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    placeholder="0"
                                                    className="h-8"
                                                    value={chaluProgress[p.id] || ''}
                                                    onChange={(e) => handleChaluProgressChange(p, e.target.value)}
                                                    max={p.packetCount}
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono text-center font-semibold text-muted-foreground">{remaining}</TableCell>
                                        </TableRow>
                                    )})}
                                    <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={2}>Chalu Total</TableCell><TableCell className="text-center">{totalSarinChaluPackets}</TableCell><TableCell></TableCell></TableRow>
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No active lots.</p>}
                    </div>
                </div>
            </DepartmentCard>

            {todays4PData.length > 0 && (
                <DepartmentCard title="4P Department" total={total4P} borderColor="border-green-400">
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Operator</TableHead><TableHead>PCS</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {todays4PData.map(d => (
                                <TableRow key={d.operator}><TableCell>{d.date}</TableCell><TableCell>{d.operator}</TableCell><TableCell>{d.pcs}</TableCell><TableCell className="text-right font-bold text-green-600">{d.pcs}</TableCell></TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={2}>Department Total</TableCell><TableCell>{total4P}</TableCell><TableCell className="text-right text-green-600">{total4P}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </DepartmentCard>
            )}

            {todaysLaserData.length > 0 && (
                 <DepartmentCard title="Laser Department" total={totalLaser} borderColor="border-red-400">
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Operator</TableHead><TableHead>PCS</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {todaysLaserData.map(d => (
                                <TableRow key={d.operator}><TableCell>{d.date}</TableCell><TableCell>{d.operator}</TableCell><TableCell>{d.pcs}</TableCell><TableCell className="text-right font-bold text-red-600">{d.pcs}</TableCell></TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={2}>Department Total</TableCell><TableCell>{totalLaser}</TableCell><TableCell className="text-right text-red-600">{totalLaser}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </DepartmentCard>
            )}

            {todays4PData.length === 0 && todaysLaserData.length === 0 && todaysReturnedSarin.length === 0 && todaysChaluSarin.length === 0 &&(
                <div className="text-center py-12 text-muted-foreground">
                    <p>No production entries recorded for today.</p>
                </div>
            )}
        </div>
    );
}

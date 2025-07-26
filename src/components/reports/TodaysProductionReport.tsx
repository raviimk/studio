
'use client';

import React, { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isToday, format, parseISO } from 'date-fns';
import {
    SARIN_PACKETS_KEY,
    LASER_LOTS_KEY,
    FOURP_TECHING_LOTS_KEY,
} from '@/lib/constants';
import * as T from '@/lib/types';
import { cn } from '@/lib/utils';

type SarinSummary = {
    operator: string;
    ls: number;
    fourP: number;
    mix: number;
    total: number;
    date: string;
};

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


export default function TodaysProductionReport() {
    const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);
    const [laserLots] = useLocalStorage<T.LaserLot[]>(LASER_LOTS_KEY, []);
    const [fourPTechingLots] = useLocalStorage<T.FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);

    const todaysSarinData = useMemo(() => {
        const todaysEntries = sarinPackets.filter(p => isToday(parseISO(p.date)));
        const summary: Record<string, SarinSummary> = {};

        todaysEntries.forEach(p => {
            if (!summary[p.operator]) {
                summary[p.operator] = { operator: p.operator, ls: 0, fourP: 0, mix: 0, total: 0, date: format(parseISO(p.date), 'PP') };
            }
            // Assuming mainPacketNumber corresponds to 4P and packetCount is Mix. LS seems to be a separate category.
            // This logic might need adjustment based on how LS is determined. For now, assuming it's 0.
            summary[p.operator].fourP += p.mainPacketNumber;
            summary[p.operator].mix += p.packetCount;
            summary[p.operator].total += p.mainPacketNumber + p.packetCount;
        });

        return Object.values(summary);
    }, [sarinPackets]);

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

    const totalSarin = useMemo(() => todaysSarinData.reduce((acc, op) => {
        acc.ls += op.ls;
        acc.fourP += op.fourP;
        acc.mix += op.mix;
        acc.total += op.total;
        return acc;
    }, { ls: 0, fourP: 0, mix: 0, total: 0 }), [todaysSarinData]);

    const totalLaser = useMemo(() => todaysLaserData.reduce((acc, op) => acc + op.pcs, 0), [todaysLaserData]);
    const total4P = useMemo(() => todays4PData.reduce((acc, op) => acc + op.pcs, 0), [todays4PData]);

    const DepartmentCard = ({ title, entriesCount, total, borderColor, children, totalBreakdown }: { title: string, entriesCount: number, total: number | string, borderColor: string, children: React.ReactNode, totalBreakdown?: string }) => (
        <Card className={cn("overflow-hidden border-t-4", borderColor)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                     <span className={cn("h-3 w-3 rounded-full", borderColor.replace('border-', 'bg-'))}></span>
                     {title} <span className="text-sm text-muted-foreground">({entriesCount} entries)</span>
                </CardTitle>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Department Total</p>
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
            {todays4PData.length > 0 && (
                <DepartmentCard title="4P Department" entriesCount={todays4PData.length} total={total4P} borderColor="border-green-400">
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
                 <DepartmentCard title="Laser Department" entriesCount={todaysLaserData.length} total={totalLaser} borderColor="border-red-400">
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
             {todaysSarinData.length > 0 && (
                 <DepartmentCard 
                    title="Sarin Department" 
                    entriesCount={todaysSarinData.length} 
                    total={totalSarin.total} 
                    borderColor="border-orange-400"
                    totalBreakdown={`LS: ${totalSarin.ls} | 4P: ${totalSarin.fourP} | Mix: ${totalSarin.mix}`}
                >
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Operator</TableHead><TableHead>LS</TableHead><TableHead>4P</TableHead><TableHead>Mix</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {todaysSarinData.map(d => (
                                <TableRow key={d.operator}>
                                    <TableCell>{d.date}</TableCell>
                                    <TableCell>{d.operator}</TableCell>
                                    <TableCell>{d.ls}</TableCell>
                                    <TableCell>{d.fourP}</TableCell>
                                    <TableCell>{d.mix}</TableCell>
                                    <TableCell className="text-right font-bold text-orange-600">{d.total}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={2}>Department Total</TableCell>
                                <TableCell>{totalSarin.ls}</TableCell>
                                <TableCell>{totalSarin.fourP}</TableCell>
                                <TableCell>{totalSarin.mix}</TableCell>
                                <TableCell className="text-right text-orange-600">{totalSarin.total}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </DepartmentCard>
            )}
            {todays4PData.length === 0 && todaysLaserData.length === 0 && todaysSarinData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No production entries recorded for today.</p>
                </div>
            )}
        </div>
    );
}

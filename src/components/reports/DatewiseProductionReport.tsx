
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  SARIN_PACKETS_KEY,
  LASER_LOTS_KEY,
  FOURP_TECHING_LOTS_KEY,
} from '@/lib/constants';
import * as T from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Diamond, Gem, Puzzle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

type LotDetail = {
    lotNumber: string;
    pcs: number;
    kapanNumber: string;
};

type OperatorData = {
    operator: string;
    pcs: number;
    lots: LotDetail[];
}

const DepartmentCard = ({ title, total, borderColor, children, icon: Icon }: { title: string, total: number | string, borderColor: string, children: React.ReactNode, icon: React.ElementType }) => (
    <Card className={cn("overflow-hidden border-t-4", borderColor)}>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
                 <Icon className={cn("h-5 w-5", borderColor.replace('border-','text-'))} />
                 {title}
            </CardTitle>
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Production</p>
                <p className="text-2xl font-bold">{total}</p>
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const DetailDialog = ({ operator, department, lots, trigger }: { operator: string, department: string, lots: LotDetail[], trigger: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>
      {trigger}
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{department} Details for {operator}</DialogTitle>
        <DialogDescription>Breakdown of all lots contributing to the total.</DialogDescription>
      </DialogHeader>
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kapan</TableHead>
              <TableHead>Lot Number</TableHead>
              <TableHead className="text-right">PCS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot, index) => (
              <TableRow key={`${lot.lotNumber}-${index}`}>
                <TableCell>{lot.kapanNumber}</TableCell>
                <TableCell>{lot.lotNumber}</TableCell>
                <TableCell className="text-right font-mono">{lot.pcs}</TableCell>
              </TableRow>
            ))}
             <TableRow className="bg-muted font-bold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-mono">{lots.reduce((sum, lot) => sum + lot.pcs, 0)}</TableCell>
              </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
);

export default function DatewiseProductionReport() {
  const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots] = useLocalStorage<T.LaserLot[]>(LASER_LOTS_KEY, []);
  const [fourPTechingLots] = useLocalStorage<T.FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
  });

  const { sarinData, laserData, fourPData, fourPTechingData } = useMemo(() => {
    if (!dateRange?.from) return { sarinData: [], laserData: [], fourPData: [], fourPTechingData: [] };
    
    const selectedDateStart = startOfDay(dateRange.from);
    const selectedDateEnd = endOfDay(dateRange.to || dateRange.from);
    const filterInterval = { start: selectedDateStart, end: selectedDateEnd };

    // Process Sarin Data
    const sarinSummary: Record<string, OperatorData> = {};
    sarinPackets.forEach(p => {
        if (p.isReturned && p.returnDate && isWithinInterval(parseISO(p.returnDate), filterInterval) && p.returnedBy) {
            if (!sarinSummary[p.returnedBy]) {
                sarinSummary[p.returnedBy] = { operator: p.returnedBy, pcs: 0, lots: [] };
            }
            sarinSummary[p.returnedBy].pcs += p.packetCount;
            sarinSummary[p.returnedBy].lots.push({ lotNumber: p.lotNumber, pcs: p.packetCount, kapanNumber: p.kapanNumber });
        }
    });

    // Process Laser Data
    const laserSummary: Record<string, OperatorData> = {};
    laserLots.forEach(l => {
        if (l.isReturned && l.returnDate && isWithinInterval(parseISO(l.returnDate), filterInterval) && l.returnedBy) {
            if (!laserSummary[l.returnedBy]) {
                laserSummary[l.returnedBy] = { operator: l.returnedBy, pcs: 0, lots: [] };
            }
            const pcs = l.subPacketCount ?? l.packetCount;
            laserSummary[l.returnedBy].pcs += pcs;
            laserSummary[l.returnedBy].lots.push({ lotNumber: l.lotNumber, pcs: pcs, kapanNumber: l.kapanNumber });
        }
    });

    // Process 4P Data
    const fourPSummary: Record<string, OperatorData> = {};
    fourPTechingLots.forEach(l => {
        if (l.isReturnedToFourP && l.returnDate && isWithinInterval(parseISO(l.returnDate), filterInterval)) {
           const operators = l.fourPData ? l.fourPData : (l.fourPOperator ? [{ operator: l.fourPOperator, pcs: l.finalPcs, amount: l.fourPAmount || 0 }] : []);
           operators.forEach(opData => {
                if (!fourPSummary[opData.operator]) {
                    fourPSummary[opData.operator] = { operator: opData.operator, pcs: 0, lots: [] };
                }
                fourPSummary[opData.operator].pcs += opData.pcs;
                fourPSummary[opData.operator].lots.push({ lotNumber: l.lot, pcs: opData.pcs, kapanNumber: l.kapan });
           });
        }
    });

    // Process 4P Teching Data
    const fourPTechingSummary: Record<string, OperatorData> = {};
    fourPTechingLots.forEach(l => {
        if (isWithinInterval(parseISO(l.entryDate), filterInterval)) {
            const operator = l.techingOperator;
            if (!fourPTechingSummary[operator]) {
                fourPTechingSummary[operator] = { operator, pcs: 0, lots: [] };
            }
            fourPTechingSummary[operator].pcs += l.finalPcs;
            fourPTechingSummary[operator].lots.push({ lotNumber: l.lot, pcs: l.finalPcs, kapanNumber: l.kapan });
        }
    });

    return { 
        sarinData: Object.values(sarinSummary).sort((a,b) => b.pcs - a.pcs),
        laserData: Object.values(laserSummary).sort((a,b) => b.pcs - a.pcs),
        fourPData: Object.values(fourPSummary).sort((a,b) => b.pcs - a.pcs),
        fourPTechingData: Object.values(fourPTechingSummary).sort((a,b) => b.pcs - a.pcs),
    };
  }, [sarinPackets, laserLots, fourPTechingLots, dateRange]);


  const totalSarin = useMemo(() => sarinData.reduce((sum, d) => sum + d.pcs, 0), [sarinData]);
  const totalLaser = useMemo(() => laserData.reduce((sum, d) => sum + d.pcs, 0), [laserData]);
  const total4P = useMemo(() => fourPData.reduce((sum, d) => sum + d.pcs, 0), [fourPData]);
  const total4PTeching = useMemo(() => fourPTechingData.reduce((sum, d) => sum + d.pcs, 0), [fourPTechingData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-wise Production</CardTitle>
        <CardDescription>View production totals for all operators across all departments for the selected date range. Only includes returned/completed work.</CardDescription>
        <div className="pt-4">
             <label className="text-sm font-medium">Select Date Range</label>
             <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
            <DepartmentCard title="Sarin Department" total={totalSarin} borderColor="border-orange-400" icon={Diamond}>
                <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {sarinData.map(d => (
                            <TableRow key={d.operator}>
                                <TableCell>{d.operator}</TableCell>
                                <TableCell className="text-right font-bold text-orange-600">
                                   <DetailDialog operator={d.operator} department="Sarin" lots={d.lots} trigger={<span className="cursor-pointer underline">{d.pcs}</span>} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {sarinData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No Sarin data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
            
            <DepartmentCard title="Laser Department" total={totalLaser} borderColor="border-red-400" icon={Gem}>
                 <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {laserData.map(d => (
                            <TableRow key={d.operator}>
                                <TableCell>{d.operator}</TableCell>
                                <TableCell className="text-right font-bold text-red-600">
                                     <DetailDialog operator={d.operator} department="Laser" lots={d.lots} trigger={<span className="cursor-pointer underline">{d.pcs}</span>} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {laserData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No Laser data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>

            <DepartmentCard title="4P Teching" total={total4PTeching} borderColor="border-blue-400" icon={Users}>
                 <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fourPTechingData.map(d => (
                            <TableRow key={d.operator}>
                                <TableCell>{d.operator}</TableCell>
                                <TableCell className="text-right font-bold text-blue-600">
                                     <DetailDialog operator={d.operator} department="4P Teching" lots={d.lots} trigger={<span className="cursor-pointer underline">{d.pcs}</span>} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {fourPTechingData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No 4P Teching data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>

            <DepartmentCard title="4P Department" total={total4P} borderColor="border-green-400" icon={Puzzle}>
                 <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fourPData.map(d => (
                            <TableRow key={d.operator}>
                                <TableCell>{d.operator}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                     <DetailDialog operator={d.operator} department="4P" lots={d.lots} trigger={<span className="cursor-pointer underline">{d.pcs}</span>} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {fourPData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No 4P data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
      </CardContent>
    </Card>
  );
}

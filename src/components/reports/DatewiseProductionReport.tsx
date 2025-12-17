
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
import { DatePicker } from '@/components/ui/date-picker';
import { startOfDay, endOfDay, isWithinInterval, parseISO, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { Diamond, Gem, Puzzle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

type SarinDetail = { lotNumber: string, pcs: number };
type LaserDetail = { lotNumber: string, pcs: number };
type FourPDetail = { lotNumber: string, pcs: number };


type OperatorSarinData = {
    operator: string;
    returned: number;
    chalu: number;
    total: number;
    returnedLots: SarinDetail[];
    chaluLots: SarinDetail[];
}
type OperatorLaserData = {
    operator: string;
    pcs: number;
    lots: LaserDetail[];
}

type OperatorFourPData = {
    operator: string;
    pcs: number;
    lots: FourPDetail[];
}


const DepartmentCard = ({ title, total, borderColor, children, icon: Icon }: { title: string, total: number | string, borderColor: string, children: React.ReactNode, icon: React.ElementType }) => (
    <Card className={cn("overflow-hidden border-t-4", borderColor)}>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
                 <Icon className={cn("h-5 w-5", borderColor.replace('border-','text-'))} />
                 {title}
            </CardTitle>
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Production</p>
                <p className="text-2xl font-bold">{total}</p>
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const DetailDialog = ({ operator, department, lots, trigger }: { operator: string, department: string, lots: { lotNumber: string, pcs: number }[], trigger: React.ReactNode }) => {
  return (
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
                <TableHead>Lot Number</TableHead>
                <TableHead className="text-right">PCS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot, index) => (
                <TableRow key={`${lot.lotNumber}-${index}`}>
                  <TableCell>{lot.lotNumber}</TableCell>
                  <TableCell className="text-right font-mono">{lot.pcs}</TableCell>
                </TableRow>
              ))}
               <TableRow className="bg-muted font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">{lots.reduce((sum, lot) => sum + lot.pcs, 0)}</TableCell>
                </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function DatewiseProductionReport() {
  const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots] = useLocalStorage<T.LaserLot[]>(LASER_LOTS_KEY, []);
  const [fourPTechingLots] = useLocalStorage<T.FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);

  const [date, setDate] = useState<Date | undefined>(new Date());

  const sarinData = useMemo((): OperatorSarinData[] => {
    if (!date) return [];
    
    const data: Record<string, { returned: number; chalu: number; returnedLots: SarinDetail[]; chaluLots: SarinDetail[] }> = {};
    const selectedDateStart = startOfDay(date);
    const selectedDateEnd = endOfDay(date);
    const dateFilter = { start: selectedDateStart, end: selectedDateEnd };

    const ensureOperator = (operator: string) => {
        if (!data[operator]) {
            data[operator] = { returned: 0, chalu: 0, returnedLots: [], chaluLots: [] };
        }
    }

    sarinPackets.forEach(p => {
        // Returned on the selected date
        if (p.isReturned && p.returnDate && p.returnedBy && isWithinInterval(parseISO(p.returnDate), dateFilter)) {
            ensureOperator(p.returnedBy);
            data[p.returnedBy].returned += p.packetCount;
            data[p.returnedBy].returnedLots.push({ lotNumber: p.lotNumber, pcs: p.packetCount });
        }

        // Chalu (running) on the selected date
        const entryDate = parseISO(p.date);
        const isCreatedOnOrBeforeSelectedDate = isBefore(entryDate, selectedDateEnd);
        const notYetReturned = !p.isReturned;
        const returnedAfterSelectedDate = p.isReturned && p.returnDate && isAfter(parseISO(p.returnDate), selectedDateEnd);
        
        if (isCreatedOnOrBeforeSelectedDate && (notYetReturned || returnedAfterSelectedDate)) {
             ensureOperator(p.operator);
             data[p.operator].chalu += p.packetCount;
             data[p.operator].chaluLots.push({ lotNumber: p.lotNumber, pcs: p.packetCount });
        }
    });

    return Object.entries(data)
        .filter(([,depts]) => depts.returned > 0 || depts.chalu > 0)
        .map(([op, depts]) => ({
            operator: op,
            ...depts,
            total: depts.returned // Only count returned in total
        }))
        .sort((a,b) => b.total - a.total);
  }, [sarinPackets, date]);

  const laserData = useMemo((): OperatorLaserData[] => {
    if (!date) return [];
    const data: Record<string, { pcs: number; lots: LaserDetail[] }> = {};
    const dateFilter = { start: startOfDay(date), end: endOfDay(date) };

    laserLots.forEach(l => {
        if (l.isReturned && l.returnDate && l.returnedBy && isWithinInterval(parseISO(l.returnDate), dateFilter)) {
            if (!data[l.returnedBy]) {
                 data[l.returnedBy] = { pcs: 0, lots: [] };
            }
            const pcs = l.subPacketCount ?? l.packetCount;
            data[l.returnedBy].pcs += pcs;
            data[l.returnedBy].lots.push({ lotNumber: l.lotNumber, pcs });
        }
    });
     return Object.entries(data)
        .map(([op, details]) => ({ operator: op, ...details }))
        .sort((a,b) => b.pcs - a.pcs);
  }, [laserLots, date]);


  const fourPData = useMemo((): OperatorFourPData[] => {
    if (!date) return [];
    const data: Record<string, { pcs: number; lots: FourPDetail[] }> = {};
    const dateFilter = { start: startOfDay(date), end: endOfDay(date) };

    fourPTechingLots.forEach(l => {
         if (l.isReturnedToFourP && l.returnDate && isWithinInterval(parseISO(l.returnDate), dateFilter)) {
            if (l.fourPData) { // New split data structure
                l.fourPData.forEach(d => {
                    if (!data[d.operator]) data[d.operator] = { pcs: 0, lots: [] };
                    data[d.operator].pcs += d.pcs;
                    data[d.operator].lots.push({ lotNumber: l.lot, pcs: d.pcs });
                });
            } else if (l.fourPOperator) { // Legacy single operator
                if (!data[l.fourPOperator]) data[l.fourPOperator] = { pcs: 0, lots: [] };
                const pcs = l.finalPcs || 0;
                data[l.fourPOperator].pcs += pcs;
                data[l.fourPOperator].lots.push({ lotNumber: l.lot, pcs });
            }
        }
    });
    return Object.entries(data)
        .map(([op, details]) => ({ operator: op, ...details }))
        .sort((a,b) => b.pcs - a.pcs);
  }, [fourPTechingLots, date]);
  
  const fourPTechingData = useMemo((): OperatorFourPData[] => {
    if (!date) return [];
    const data: Record<string, { pcs: number; lots: FourPDetail[] }> = {};
    const dateFilter = { start: startOfDay(date), end: endOfDay(date) };

     fourPTechingLots.forEach(l => {
        if (isWithinInterval(parseISO(l.entryDate), dateFilter)) {
            if (!data[l.techingOperator]) data[l.techingOperator] = { pcs: 0, lots: [] };
            const pcs = l.finalPcs || 0;
            data[l.techingOperator].pcs += pcs;
            data[l.techingOperator].lots.push({ lotNumber: l.lot, pcs });
        }
    });
    return Object.entries(data)
        .map(([op, details]) => ({ operator: op, ...details }))
        .sort((a,b) => b.pcs - a.pcs);
  }, [fourPTechingLots, date]);

  const totals = useMemo(() => {
    return {
        sarin: sarinData.reduce((sum, d) => sum + d.total, 0),
        laser: laserData.reduce((sum, d) => sum + d.pcs, 0),
        fourP: fourPData.reduce((sum, d) => sum + d.pcs, 0),
        fourPTeching: fourPTechingData.reduce((sum, d) => sum + d.pcs, 0),
    };
  }, [sarinData, laserData, fourPData, fourPTechingData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-wise All Departments Report</CardTitle>
        <CardDescription>View production for all operators across Sarin, Laser, and 4P for a selected date.</CardDescription>
        <div className="pt-4">
             <label className="text-sm font-medium">Select Date</label>
             <DatePicker date={date} setDate={setDate} />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
            <DepartmentCard title="Sarin Department" total={totals.sarin} borderColor="border-orange-400" icon={Diamond}>
                <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Returned</TableHead><TableHead>Chalu (For Info)</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {sarinData.map(d => (
                            <TableRow key={d.operator}>
                                <TableCell>{d.operator}</TableCell>
                                <TableCell>{d.returned || '-'}</TableCell>
                                <TableCell>{d.chalu || '-'}</TableCell>
                                <TableCell className="text-right font-bold text-orange-600">
                                   <DetailDialog 
                                        operator={d.operator}
                                        department="Sarin (Returned)"
                                        lots={d.returnedLots}
                                        trigger={ <span className="cursor-pointer underline">{d.total}</span> }
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {sarinData.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No Sarin data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
             <DepartmentCard title="Laser Department" total={totals.laser} borderColor="border-red-400" icon={Gem}>
                <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {laserData.map(d => (
                            <TableRow key={d.operator}><TableCell>{d.operator}</TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                                <DetailDialog
                                  operator={d.operator}
                                  department="Laser"
                                  lots={d.lots}
                                  trigger={<span className="cursor-pointer underline">{d.pcs}</span>}
                                />
                            </TableCell>
                            </TableRow>
                        ))}
                        {laserData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No Laser data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
             <DepartmentCard title="4P Department" total={totals.fourP} borderColor="border-green-400" icon={Puzzle}>
                 <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fourPData.map(d => (
                             <TableRow key={d.operator}><TableCell>{d.operator}</TableCell>
                             <TableCell className="text-right font-bold text-green-600">
                                <DetailDialog
                                  operator={d.operator}
                                  department="4P"
                                  lots={d.lots}
                                  trigger={<span className="cursor-pointer underline">{d.pcs}</span>}
                                />
                             </TableCell>
                             </TableRow>
                        ))}
                        {fourPData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No 4P data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
            <DepartmentCard title="4P Teching" total={totals.fourPTeching} borderColor="border-blue-400" icon={Sparkles}>
                 <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fourPTechingData.map(d => (
                             <TableRow key={d.operator}><TableCell>{d.operator}</TableCell>
                             <TableCell className="text-right font-bold text-blue-600">
                                <DetailDialog
                                  operator={d.operator}
                                  department="4P Teching"
                                  lots={d.lots}
                                  trigger={<span className="cursor-pointer underline">{d.pcs}</span>}
                                />
                             </TableCell>
                             </TableRow>
                        ))}
                        {fourPTechingData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No 4P Teching data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
      </CardContent>
    </Card>
  );
}

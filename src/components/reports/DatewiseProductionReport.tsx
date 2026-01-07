
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  SARIN_PACKETS_KEY,
  LASER_LOTS_KEY,
  FOURP_TECHING_LOTS_KEY,
  PRODUCTION_HISTORY_KEY
} from '@/lib/constants';
import * as T from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval, parseISO, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Diamond, Gem, Puzzle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

type LotDetail = {
    lotNumber: string;
    pcs: number;
    kapanNumber: string;
    returnDate?: string;
};


type OperatorSarinData = {
    operator: string;
    returned: number;
    chalu: number;
    total: number;
    returnedLots: LotDetail[];
    chaluLots: LotDetail[];
}
type OperatorLaserData = {
    operator: string;
    pcs: number;
    lots: LotDetail[];
}

type OperatorFourPData = {
    operator: string;
    pcs: number;
    lots: LotDetail[];
}


const DepartmentCard = ({ title, total, borderColor, children, icon: Icon, totalBreakdown }: { title: string, total: number | string, borderColor: string, children: React.ReactNode, icon: React.ElementType, totalBreakdown?: string }) => (
    <Card className={cn("overflow-hidden border-t-4", borderColor)}>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
                 <Icon className={cn("h-5 w-5", borderColor.replace('border-','text-'))} />
                 {title}
            </CardTitle>
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Production for Period</p>
                <p className="text-2xl font-bold">{total}</p>
                {totalBreakdown && <p className="text-xs text-muted-foreground">{totalBreakdown}</p>}
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const DetailDialog = ({ operator, department, lots, trigger }: { operator: string, department: string, lots: LotDetail[], trigger: React.ReactNode }) => {
  const sortedLots = useMemo(() => {
    return lots.sort((a, b) => {
        if (!a.returnDate || !b.returnDate) return 0;
        return parseISO(a.returnDate).getTime() - parseISO(b.returnDate).getTime();
    })
  }, [lots]);

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
                <TableHead>Kapan</TableHead>
                <TableHead>Lot Number</TableHead>
                <TableHead>Return Time</TableHead>
                <TableHead className="text-right">PCS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLots.map((lot, index) => (
                <TableRow key={`${lot.lotNumber}-${index}`}>
                  <TableCell>{lot.kapanNumber}</TableCell>
                  <TableCell>{lot.lotNumber}</TableCell>
                  <TableCell>{lot.returnDate ? format(parseISO(lot.returnDate), 'p') : 'N/A'}</TableCell>
                  <TableCell className="text-right font-mono">{lot.pcs}</TableCell>
                </TableRow>
              ))}
               <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={3}>Total</TableCell>
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
  const [productionHistory] = useLocalStorage<T.ProductionHistory>(PRODUCTION_HISTORY_KEY, {});
  const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: new Date(),
      to: new Date(),
  });

  const sarinData = useMemo((): OperatorSarinData[] => {
    if (!dateRange?.from) return [];
    
    const data: Record<string, { returned: number; chalu: number; returnedLots: LotDetail[]; chaluLots: LotDetail[] }> = {};
    const selectedDateStart = startOfDay(dateRange.from);
    const selectedDateEnd = endOfDay(dateRange.to || dateRange.from);
    const filterInterval = { start: selectedDateStart, end: selectedDateEnd };

    // Process permanent history
    for (const dateStr in productionHistory) {
      if (isWithinInterval(parseISO(dateStr), filterInterval)) {
        productionHistory[dateStr].forEach(entry => {
          if(!data[entry.operator]) {
            data[entry.operator] = { returned: 0, chalu: 0, returnedLots: [], chaluLots: [] };
          }
          data[entry.operator].returned += entry.pcs;
          data[entry.operator].returnedLots.push({ lotNumber: entry.lotNumber, pcs: entry.pcs, kapanNumber: entry.kapanNumber, returnDate: dateStr });
        });
      }
    }
    
    // Process live "chalu" packets from sarinPackets
    sarinPackets.forEach(packet => {
        if (!packet.isReturned) {
             if(!data[packet.operator]) {
                data[packet.operator] = { returned: 0, chalu: 0, returnedLots: [], chaluLots: [] };
            }
            data[packet.operator].chalu += packet.packetCount;
            data[packet.operator].chaluLots.push({ lotNumber: packet.lotNumber, pcs: packet.packetCount, kapanNumber: packet.kapanNumber, returnDate: packet.date });
        }
    });


    return Object.entries(data)
        .map(([op, depts]) => ({
            operator: op,
            ...depts,
            total: depts.returned + depts.chalu
        }))
        .sort((a,b) => b.total - a.total);
  }, [productionHistory, sarinPackets, dateRange]);


  const totalSarinProduction = useMemo(() => {
    return sarinData.reduce((sum, d) => sum + d.total, 0)
  }, [sarinData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-wise All Departments Report</CardTitle>
        <CardDescription>View production for all operators across Sarin, Laser, and 4P for the selected date range.</CardDescription>
        <div className="pt-4">
             <label className="text-sm font-medium">Select Date Range</label>
             <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
            <DepartmentCard 
                title="Sarin Department" 
                total={totalSarinProduction} 
                borderColor="border-orange-400" 
                icon={Diamond}
                totalBreakdown={`Returned: ${sarinData.reduce((s,d) => s+d.returned,0)} + Chalu: ${sarinData.reduce((s,d) => s+d.chalu,0)}`}
            >
                <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {sarinData.map(d => (
                            <TableRow key={d.operator}>
                                <TableCell>{d.operator}</TableCell>
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
      </CardContent>
    </Card>
  );
}

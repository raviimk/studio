
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
import { DatePickerWithPresets } from '@/components/ui/date-picker-presets';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, parseISO, format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

type OperatorProduction = {
  operator: string;
  sarinReturned: number;
  sarinChalu: number;
  laserPcs: number;
  fourPPcs: number;
  fourPTechingPcs: number;
  total: number;
};

export default function DatewiseProductionReport() {
  const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots] = useLocalStorage<T.LaserLot[]>(LASER_LOTS_KEY, []);
  const [fourPTechingLots] = useLocalStorage<T.FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const operatorSummary = useMemo(() => {
    if (!dateRange?.from) return [];

    const summary: Record<string, OperatorProduction> = {};

    const addToSummary = (operator: string, type: keyof OperatorProduction, value: number) => {
        if (!summary[operator]) {
            summary[operator] = {
                operator,
                sarinReturned: 0,
                sarinChalu: 0,
                laserPcs: 0,
                fourPPcs: 0,
                fourPTechingPcs: 0,
                total: 0,
            };
        }
        summary[operator][type] += value;
        summary[operator].total += value;
    };

    // Process Sarin Packets
    sarinPackets.forEach(p => {
        const isReturnedToday = p.isReturned && p.returnDate && isWithinInterval(parseISO(p.returnDate), { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from) });
        const isChaluToday = !p.isReturned && isWithinInterval(parseISO(p.date), { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from) });
        
        if (isReturnedToday && p.returnedBy) {
             addToSummary(p.returnedBy, 'sarinReturned', p.packetCount);
        }
        if (isChaluToday) {
             addToSummary(p.operator, 'sarinChalu', p.packetCount);
        }
    });

    // Process Laser Lots
    laserLots.forEach(l => {
        if (l.isReturned && l.returnDate && l.returnedBy && isWithinInterval(parseISO(l.returnDate), { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from) })) {
            const pcs = l.subPacketCount ?? l.packetCount;
            addToSummary(l.returnedBy, 'laserPcs', pcs);
        }
    });
    
    // Process 4P and 4P Teching Lots
    fourPTechingLots.forEach(l => {
        const entryDate = parseISO(l.entryDate);
        if (isWithinInterval(entryDate, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from) })) {
            addToSummary(l.techingOperator, 'fourPTechingPcs', l.finalPcs || 0);
        }
        
        if (l.isReturnedToFourP && l.returnDate && isWithinInterval(parseISO(l.returnDate), { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from) })) {
            if(l.fourPData) {
                l.fourPData.forEach(d => {
                     addToSummary(d.operator, 'fourPPcs', d.pcs);
                })
            } else if (l.fourPOperator) { // Legacy
                 addToSummary(l.fourPOperator, 'fourPPcs', l.finalPcs || 0);
            }
        }
    });


    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [sarinPackets, laserLots, fourPTechingLots, dateRange]);

  const totals = useMemo(() => {
    return operatorSummary.reduce((acc, op) => {
        acc.sarinReturned += op.sarinReturned;
        acc.sarinChalu += op.sarinChalu;
        acc.laser += op.laserPcs;
        acc.fourP += op.fourPPcs;
        acc.fourPTeching += op.fourPTechingPcs;
        acc.grandTotal += op.total;
        return acc;
    }, { sarinReturned: 0, sarinChalu: 0, laser: 0, fourP: 0, fourPTeching: 0, grandTotal: 0 });
  }, [operatorSummary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-wise All Departments Report</CardTitle>
        <CardDescription>View production for all operators across Sarin, Laser, and 4P within a selected date range.</CardDescription>
        <div className="pt-4">
             <label className="text-sm font-medium">Date Range</label>
             <DatePickerWithPresets date={dateRange} setDate={setDateRange} />
        </div>
      </CardHeader>
      <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-center">
              <Card>
                  <CardHeader><CardTitle>Total Sarin</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-orange-600">{totals.sarinReturned + totals.sarinChalu}</p></CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Total Laser</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-red-600">{totals.laser}</p></CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Total 4P Work</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-green-600">{totals.fourP}</p></CardContent>
              </Card>
          </div>

          <Separator className="my-6"/>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operator</TableHead>
              <TableHead>Sarin Returned</TableHead>
              <TableHead>Sarin Chalu</TableHead>
              <TableHead>Laser</TableHead>
              <TableHead>4P</TableHead>
              <TableHead>4P Teching</TableHead>
              <TableHead className="text-right">Total PCS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operatorSummary.map(op => (
              <TableRow key={op.operator}>
                <TableCell className="font-semibold">{op.operator}</TableCell>
                <TableCell>{op.sarinReturned || '-'}</TableCell>
                <TableCell>{op.sarinChalu || '-'}</TableCell>
                <TableCell>{op.laserPcs || '-'}</TableCell>
                <TableCell>{op.fourPPcs || '-'}</TableCell>
                <TableCell>{op.fourPTechingPcs || '-'}</TableCell>
                <TableCell className="text-right font-bold">{op.total}</TableCell>
              </TableRow>
            ))}
            {operatorSummary.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Totals</TableCell>
                    <TableCell>{totals.sarinReturned}</TableCell>
                    <TableCell>{totals.sarinChalu}</TableCell>
                    <TableCell>{totals.laser}</TableCell>
                    <TableCell>{totals.fourP}</TableCell>
                    <TableCell>{totals.fourPTeching}</TableCell>
                    <TableCell className="text-right">{totals.grandTotal}</TableCell>
                </TableRow>
            )}
            {operatorSummary.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No data for the selected period.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

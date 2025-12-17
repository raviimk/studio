
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY } from '@/lib/constants';
import { SarinPacket } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithPresets } from '@/components/ui/date-picker-presets';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

type OperatorProduction = {
  operator: string;
  returnedPackets: number;
  returnedLots: Set<string>;
  chaluPackets: number;
  chaluLots: Set<string>;
  totalPackets: number;
};

export default function DatewiseProductionReport() {
  const [sarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const operatorSummary = useMemo(() => {
    if (!sarinPackets || !dateRange?.from) return [];

    const summary: Record<string, OperatorProduction> = {};

    sarinPackets.forEach(packet => {
      const packetDate = parseISO(packet.date);
      
      if (!isWithinInterval(packetDate, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from) })) {
          return;
      }
      
      const operator = packet.operator;
      if (!summary[operator]) {
        summary[operator] = {
          operator: operator,
          returnedPackets: 0,
          returnedLots: new Set(),
          chaluPackets: 0,
          chaluLots: new Set(),
          totalPackets: 0,
        };
      }

      if (packet.isReturned) {
        summary[operator].returnedPackets += packet.packetCount;
        summary[operator].returnedLots.add(packet.lotNumber);
      } else {
        summary[operator].chaluPackets += packet.packetCount;
        summary[operator].chaluLots.add(packet.lotNumber);
      }
      summary[operator].totalPackets += packet.packetCount;
    });

    return Object.values(summary).sort((a, b) => b.totalPackets - a.totalPackets);
  }, [sarinPackets, dateRange]);

  const totals = useMemo(() => {
    return operatorSummary.reduce((acc, op) => {
        acc.returned += op.returnedPackets;
        acc.chalu += op.chaluPackets;
        acc.total += op.totalPackets;
        return acc;
    }, { returned: 0, chalu: 0, total: 0 });
  }, [operatorSummary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-wise Sarin Report</CardTitle>
        <CardDescription>View returned and running (chalu) production for each operator within a selected date range.</CardDescription>
        <div className="pt-4">
             <label className="text-sm font-medium">Date Range</label>
             <DatePickerWithPresets date={dateRange} setDate={setDateRange} />
        </div>
      </CardHeader>
      <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6 text-center">
              <Card>
                  <CardHeader><CardTitle>Total Returned</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-green-600">{totals.returned}</p></CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Total Chalu</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold text-yellow-600">{totals.chalu}</p></CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Grand Total</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold">{totals.total}</p></CardContent>
              </Card>
          </div>

          <Separator className="my-6"/>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operator</TableHead>
              <TableHead>Returned Lots</TableHead>
              <TableHead>Chalu Lots</TableHead>
              <TableHead className="text-right">Total Packets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operatorSummary.map(op => (
              <TableRow key={op.operator}>
                <TableCell className="font-semibold">{op.operator}</TableCell>
                <TableCell>
                    <Badge variant="secondary" className="mr-2">{op.returnedLots.size}</Badge>
                    ({op.returnedPackets} pkts)
                </TableCell>
                <TableCell>
                    <Badge variant="destructive" className="mr-2">{op.chaluLots.size}</Badge>
                    ({op.chaluPackets} pkts)
                </TableCell>
                <TableCell className="text-right font-bold">{op.totalPackets}</TableCell>
              </TableRow>
            ))}
            {operatorSummary.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data for the selected period.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

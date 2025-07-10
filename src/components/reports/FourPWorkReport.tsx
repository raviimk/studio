
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_OPERATORS_KEY } from '@/lib/constants';
import { FourPLot, FourPOperator } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

export default function FourPWorkReport() {
  const [fourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [fourPOperators] = useLocalStorage<FourPOperator[]>(FOURP_OPERATORS_KEY, []);
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = useMemo(() => {
    return fourPTechingLots.filter(lot => {
      if (!lot.isReturnedToFourP || !lot.returnDate) return false;
      const lotDate = new Date(lot.returnDate);
      const isOperatorMatch = selectedOperator === 'all' || lot.fourPOperator === selectedOperator;
      const isDateMatch = dateRange?.from && dateRange?.to
        ? lotDate >= startOfDay(dateRange.from) && lotDate <= endOfDay(dateRange.to)
        : true;
      return isOperatorMatch && isDateMatch;
    }).sort((a, b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime());
  }, [fourPTechingLots, selectedOperator, dateRange]);

  const summary = useMemo(() => {
    return filteredData.reduce((acc, lot) => {
        acc.totalPcs += lot.pcs;
        acc.totalBlocking += lot.blocking || 0;
        acc.totalFinalPcs += lot.finalPcs || 0;
        acc.totalAmount += lot.fourPAmount || 0;
        return acc;
    }, { totalPcs: 0, totalAmount: 0, totalBlocking: 0, totalFinalPcs: 0 });
  }, [filteredData]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>4P Work Report</CardTitle>
          <CardDescription>Analyze all completed 4P work entries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">4P Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger><SelectValue placeholder="Select Operator" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {fourPOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
          <Button onClick={handlePrint}>Print Report</Button>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total PCS</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{summary.totalPcs.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Blocking</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold text-destructive">{summary.totalBlocking.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Final PCS</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{summary.totalFinalPcs.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Amount (₹)</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">₹{summary.totalAmount.toFixed(2)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Report Data</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Kapan</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>4P Operator</TableHead>
                  <TableHead>Total PCS</TableHead>
                  <TableHead>Blocking</TableHead>
                  <TableHead>Final PCS</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{format(new Date(lot.returnDate!), 'PP')}</TableCell>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell><Badge>{lot.fourPOperator}</Badge></TableCell>
                    <TableCell>{lot.pcs}</TableCell>
                    <TableCell className="text-destructive">{lot.blocking || 0}</TableCell>
                    <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                    <TableCell>₹{lot.fourPAmount?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No data matches your filters.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

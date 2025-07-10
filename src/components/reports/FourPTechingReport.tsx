
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_TECHING_OPERATORS_KEY } from '@/lib/constants';
import { FourPLot, FourPTechingOperator } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '../ui/button';
import { format } from 'date-fns';

export default function FourPTechingReport() {
  const [fourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [techingOperators] = useLocalStorage<FourPTechingOperator[]>(FOURP_TECHING_OPERATORS_KEY, []);
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = useMemo(() => {
    return fourPTechingLots.filter(lot => {
      const lotDate = new Date(lot.entryDate);
      const isOperatorMatch = selectedOperator === 'all' || lot.techingOperator === selectedOperator;
      const isDateMatch = dateRange?.from && dateRange?.to
        ? lotDate >= startOfDay(dateRange.from) && lotDate <= endOfDay(dateRange.to)
        : true;
      return isOperatorMatch && isDateMatch;
    }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [fourPTechingLots, selectedOperator, dateRange]);

  const summary = useMemo(() => {
    return filteredData.reduce((acc, lot) => {
        acc.totalPcs += lot.pcs;
        acc.totalAmount += lot.techingAmount;
        return acc;
    }, { totalPcs: 0, totalAmount: 0 });
  }, [filteredData]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>4P Teching Report</CardTitle>
          <CardDescription>Analyze all 4P Teching entries and their value.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Teching Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger><SelectValue placeholder="Select Operator" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {techingOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
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
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Total PCS</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{summary.totalPcs.toLocaleString()}</p></CardContent>
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
                  <TableHead>Entry Date</TableHead>
                  <TableHead>Kapan</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Teching Operator</TableHead>
                  <TableHead>PCS</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{format(new Date(lot.entryDate), 'PP')}</TableCell>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell><Badge variant="outline">{lot.techingOperator}</Badge></TableCell>
                    <TableCell>{lot.pcs}</TableCell>
                    <TableCell>₹{lot.techingAmount?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No data matches your filters.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

export default function SarinReport() {
  const [sarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [returnStatus, setReturnStatus] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = useMemo(() => {
    return sarinPackets.filter(p => {
      const packetDate = new Date(p.date);
      const isOperatorMatch = selectedOperator === 'all' || p.operator === selectedOperator;
      const isStatusMatch = returnStatus === 'all' || (returnStatus === 'returned' && p.isReturned) || (returnStatus === 'not-returned' && !p.isReturned);
      const isDateMatch = dateRange?.from && dateRange?.to
        ? packetDate >= startOfDay(dateRange.from) && packetDate <= endOfDay(dateRange.to)
        : true;
      return isOperatorMatch && isStatusMatch && isDateMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets, selectedOperator, returnStatus, dateRange]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sarin Production Report</CardTitle>
          <CardDescription>Analyze Sarin packet entries with powerful filters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger><SelectValue placeholder="Select Operator" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {sarinOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="flex-1">
              <label className="text-sm font-medium">Return Status</label>
              <Select value={returnStatus} onValueChange={setReturnStatus}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="not-returned">Not Returned</SelectItem>
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
      
      <Card>
        <CardHeader><CardTitle>Report Data</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lot #</TableHead>
                  <TableHead>Kapan #</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Packet Count</TableHead>
                  <TableHead>Jiram</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{format(new Date(p.date), 'PP')}</TableCell>
                    <TableCell>{p.lotNumber}</TableCell>
                    <TableCell>{p.kapanNumber}</TableCell>
                    <TableCell>{p.operator}</TableCell>
                    <TableCell>{p.machine}</TableCell>
                    <TableCell>{p.packetCount}</TableCell>
                    <TableCell>{p.jiramCount || 0}</TableCell>
                    <TableCell>
                      <Badge variant={p.isReturned ? 'secondary' : 'destructive'}>
                        {p.isReturned ? 'Returned' : 'Not Returned'}
                      </Badge>
                    </TableCell>
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

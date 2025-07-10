
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_OPERATORS_KEY } from '@/lib/constants';
import { LaserLot, LaserOperator } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

export default function LaserReport() {
  const [laserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [returnStatus, setReturnStatus] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = useMemo(() => {
    return laserLots.filter(lot => {
      const lotDate = new Date(lot.entryDate);
      const isOperatorMatch = selectedOperator === 'all' || lot.returnedBy === selectedOperator;
       const isStatusMatch = returnStatus === 'all' || (returnStatus === 'returned' && lot.isReturned) || (returnStatus === 'not-returned' && !lot.isReturned);
      const isDateMatch = dateRange?.from && dateRange?.to
        ? lotDate >= startOfDay(dateRange.from) && lotDate <= endOfDay(dateRange.to)
        : true;
      return isOperatorMatch && isStatusMatch && isDateMatch;
    }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [laserLots, selectedOperator, returnStatus, dateRange]);
  
  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laser Production Report</CardTitle>
           <CardDescription>Analyze laser lot entries with powerful filters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
             <div className="flex-1">
              <label className="text-sm font-medium">Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger><SelectValue placeholder="Select Operator" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {laserOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
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
                  <TableHead>Lot #</TableHead>
                  <TableHead>Tension</TableHead>
                  <TableHead>Kapan #</TableHead>
                  <TableHead>Packet Count</TableHead>
                  <TableHead>Entry Date</TableHead>
                  <TableHead>Returned By</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.lotNumber}</TableCell>
                    <TableCell>{lot.tensionType}</TableCell>
                    <TableCell>{lot.kapanNumber}</TableCell>
                    <TableCell>{lot.packetCount}</TableCell>
                    <TableCell>{format(new Date(lot.entryDate), 'PP')}</TableCell>
                    <TableCell>{lot.returnedBy || 'N/A'}</TableCell>
                    <TableCell>{lot.returnDate ? format(new Date(lot.returnDate), 'PP') : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={lot.isReturned ? 'secondary' : 'destructive'}>
                        {lot.isReturned ? 'Returned' : 'Not Returned'}
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

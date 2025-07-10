'use client';
import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_OPERATORS_KEY } from '@/lib/constants';
import { LaserLot, LaserOperator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function ReturnLaserLotPage() {
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [selectedOperators, setSelectedOperators] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const handleReturn = (id: string) => {
    const operatorName = selectedOperators[id];
    if (!operatorName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an operator.' });
      return;
    }
    if (window.confirm(`Are you sure you want to return this lot by ${operatorName}?`)) {
      const updatedLots = laserLots.map(lot =>
        lot.id === id ? { ...lot, isReturned: true, returnedBy: operatorName, returnDate: new Date().toISOString() } : lot
      );
      setLaserLots(updatedLots);
      toast({ title: 'Success', description: 'Lot has been marked as returned.' });
    }
  };

  const unreturnedLots = laserLots.filter(lot => !lot.isReturned);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Return Laser Lot" description="Mark laser lots as returned." />
      <Card>
        <CardHeader><CardTitle>Unreturned Lots</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot No.</TableHead>
                <TableHead>Kapan No.</TableHead>
                <TableHead>Tension</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Packets</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Select Operator</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unreturnedLots.map(lot => (
                <TableRow key={lot.id}>
                  <TableCell>{lot.lotNumber}</TableCell>
                  <TableCell>{lot.kapanNumber}</TableCell>
                  <TableCell>{lot.tensionType}</TableCell>
                  <TableCell>{lot.machine}</TableCell>
                  <TableCell>{lot.packetCount}</TableCell>
                  <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                  <TableCell>
                    <Select onValueChange={(value) => setSelectedOperators(prev => ({ ...prev, [lot.id]: value }))}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {laserOperators.map(op => (
                          <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleReturn(lot.id)} disabled={!selectedOperators[lot.id]}>
                      Return Lot
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {unreturnedLots.length === 0 && <p className="text-center text-muted-foreground p-4">No unreturned lots found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

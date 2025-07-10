'use client';
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UnreturnedLot {
  lotNumber: string;
  machine: string;
  operator: string;
  entryDate: string;
  packetIds: string[];
}

export default function ReturnSarinLotPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const { toast } = useToast();
  const [returningOperator, setReturningOperator] = useState<string>('');


  const unreturnedLots: UnreturnedLot[] = useMemo(() => {
    const lots: Record<string, UnreturnedLot> = {};
    sarinPackets
      .filter(p => !p.isReturned)
      .forEach(p => {
        if (!lots[p.lotNumber]) {
          lots[p.lotNumber] = {
            lotNumber: p.lotNumber,
            machine: p.machine,
            operator: p.operator,
            entryDate: p.date,
            packetIds: [],
          };
        }
        lots[p.lotNumber].packetIds.push(p.id);
      });
    return Object.values(lots);
  }, [sarinPackets]);

  const handleReturn = (lotNumber: string) => {
    if (!returningOperator) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select who is returning the lot.' });
        return;
    }
    if (window.confirm('Are you sure you want to return this lot?')) {
      const updatedPackets = sarinPackets.map(p =>
        p.lotNumber === lotNumber ? { ...p, isReturned: true, returnedBy: returningOperator, returnDate: new Date().toISOString() } : p
      );
      setSarinPackets(updatedPackets);
      toast({ title: 'Success', description: `Lot ${lotNumber} has been marked as returned.` });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Return Sarin Lot" description="Mark Sarin lots as returned." />
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle>Unreturned Lots</CardTitle>
                <div className='w-full sm:w-auto'>
                    <Select onValueChange={setReturningOperator} value={returningOperator}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select Returning Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            {sarinOperators.map(op => (
                            <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Number</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unreturnedLots.map(lot => (
                <TableRow key={lot.lotNumber}>
                  <TableCell>{lot.lotNumber}</TableCell>
                  <TableCell>{lot.machine}</TableCell>
                  <TableCell>{lot.operator}</TableCell>
                  <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleReturn(lot.lotNumber)} disabled={!returningOperator}>Return Lot</Button>
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

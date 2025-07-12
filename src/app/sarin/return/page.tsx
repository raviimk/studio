
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
import { Input } from '@/components/ui/input';

interface UnreturnedLot {
  lotNumber: string;
  kapanNumber: string;
  machine: string;
  operator: string;
  entryDate: string;
  packetIds: string[];
  mainPacketCount: number;
  totalPacketCount: number;
  totalJiramCount: number;
}

export default function ReturnSarinLotPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const { toast } = useToast();
  const [returningOperator, setReturningOperator] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');


  const unreturnedLots: UnreturnedLot[] = useMemo(() => {
    const lots: Record<string, UnreturnedLot> = {};
    const searchLower = searchTerm.toLowerCase();

    sarinPackets
      .filter(p => {
        if (!p.isReturned) {
            if (!searchTerm) return true;
            return p.lotNumber.toLowerCase().includes(searchLower) ||
                   p.kapanNumber.toLowerCase().includes(searchLower) ||
                   p.operator.toLowerCase().includes(searchLower);
        }
        return false;
      })
      .forEach(p => {
        if (!lots[p.lotNumber]) {
          lots[p.lotNumber] = {
            lotNumber: p.lotNumber,
            kapanNumber: p.kapanNumber,
            machine: p.machine,
            operator: p.operator,
            entryDate: p.date,
            packetIds: [],
            mainPacketCount: 0,
            totalPacketCount: 0,
            totalJiramCount: 0,
          };
        }
        const lot = lots[p.lotNumber];
        lot.packetIds.push(p.id);
        lot.mainPacketCount += 1; // Correctly count each entry as one "main packet"
        lot.totalPacketCount += p.packetCount;
        lot.totalJiramCount += p.jiramCount || 0;
      });
    return Object.values(lots).sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [sarinPackets, searchTerm]);

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
            <CardTitle>Unreturned Lots</CardTitle>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Search by Lot, Kapan, or Operator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Number</TableHead>
                <TableHead>Kapan Number</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>M / P / J</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unreturnedLots.map(lot => (
                <TableRow key={lot.lotNumber}>
                  <TableCell>{lot.lotNumber}</TableCell>
                  <TableCell>{lot.kapanNumber}</TableCell>
                  <TableCell>{lot.operator}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-bold">
                        {lot.mainPacketCount} / {lot.totalPacketCount} / {lot.totalJiramCount}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleReturn(lot.lotNumber)} disabled={!returningOperator || returningOperator !== lot.operator}>Return Lot</Button>
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

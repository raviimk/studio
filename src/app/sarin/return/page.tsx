
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


export default function ReturnSarinLotPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const { toast } = useToast();
  const [returningOperator, setReturningOperator] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');


  const unreturnedEntries: SarinPacket[] = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return sarinPackets
      .filter(p => {
        if (p.isReturned) return false;
        
        if (!searchTerm) return true;
        
        return p.lotNumber.toLowerCase().includes(searchLower) ||
               p.kapanNumber.toLowerCase().includes(searchLower) ||
               p.operator.toLowerCase().includes(searchLower);
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets, searchTerm]);

  const handleReturn = (packetId: string) => {
    if (!returningOperator) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select who is returning the lot.' });
        return;
    }
    const packetToReturn = sarinPackets.find(p => p.id === packetId);

    if (window.confirm(`Are you sure you want to return Lot ${packetToReturn?.lotNumber} (Kapan: ${packetToReturn?.kapanNumber})?`)) {
      const updatedPackets = sarinPackets.map(p =>
        p.id === packetId ? { ...p, isReturned: true, returnedBy: returningOperator, returnDate: new Date().toISOString() } : p
      );
      setSarinPackets(updatedPackets);
      toast({ title: 'Success', description: `Lot entry has been marked as returned.` });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Return Sarin Lot" description="Mark Sarin lots as returned." />
      <Card>
        <CardHeader>
            <CardTitle>Unreturned Entries</CardTitle>
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
              {unreturnedEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.lotNumber}</TableCell>
                  <TableCell>{entry.kapanNumber}</TableCell>
                  <TableCell>{entry.operator}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-bold">
                        {entry.mainPacketNumber} / {entry.packetCount} / {entry.jiramCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(entry.date), 'PPp')}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleReturn(entry.id)} disabled={!returningOperator || returningOperator !== entry.operator}>
                        Return Entry
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {unreturnedEntries.length === 0 && <p className="text-center text-muted-foreground p-4">No unreturned entries found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

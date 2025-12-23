
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function ReturnSarinLotPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const { toast } = useToast();

  const [returningOperator, setReturningOperator] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());

   useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const unreturnedEntries: SarinPacket[] = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return sarinPackets
      .filter(p => {
        if (p.isReturned) return false;
        
        const operatorMatch = !returningOperator || p.operator === returningOperator;

        const searchMatch = !searchTerm ||
               p.lotNumber.toLowerCase().includes(searchLower) ||
               p.kapanNumber.toLowerCase().includes(searchLower) ||
               p.operator.toLowerCase().includes(searchLower);

        return operatorMatch && searchMatch;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets, searchTerm, returningOperator]);
  
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
      setReturningOperator('');
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Kapan</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>M / P / J</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unreturnedEntries.map(entry => {
                    const timeDiff = differenceInMinutes(now, parseISO(entry.date));
                    const isOverdue = timeDiff > 10;
                    return (
                    <TableRow key={entry.id}>
                        <TableCell>{entry.lotNumber}</TableCell>
                        <TableCell>{entry.kapanNumber}</TableCell>
                        <TableCell>{entry.operator}</TableCell>
                        <TableCell className="font-mono">{entry.mainPacketNumber} / {entry.packetCount} / {entry.jiramCount || 0}</TableCell>
                        <TableCell>{format(new Date(entry.date), 'PPp')}</TableCell>
                        <TableCell>
                            <Button 
                            onClick={() => handleReturn(entry.id)} 
                            disabled={!returningOperator || returningOperator !== entry.operator}
                            variant={isOverdue ? 'destructive' : 'default'}
                            className={cn(isOverdue && 'animate-pulse')}
                            >
                                Return Entry
                            </Button>
                        </TableCell>
                    </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
          {unreturnedEntries.length === 0 && <p className="text-center text-muted-foreground p-4">No unreturned entries found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

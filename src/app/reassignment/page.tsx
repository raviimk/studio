'use client';
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY, REASSIGN_LOGS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator, ReassignLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReassignmentPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [reassignLogs, setReassignLogs] = useLocalStorage<ReassignLog[]>(REASSIGN_LOGS_KEY, []);
  const [fromOperator, setFromOperator] = useState<string>('');
  const [toOperator, setToOperator] = useState<string>('');
  const [selectedPackets, setSelectedPackets] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const availablePackets = useMemo(() => {
    if (!fromOperator) return [];
    return sarinPackets.filter(p => p.operator === fromOperator && !p.isReturned);
  }, [fromOperator, sarinPackets]);

  const handleSelectAll = (checked: boolean) => {
    const newSelected: Record<string, boolean> = {};
    if (checked) {
      availablePackets.forEach(p => newSelected[p.id] = true);
    }
    setSelectedPackets(newSelected);
  };
  
  const handleSelectPacket = (packetId: string, checked: boolean) => {
    setSelectedPackets(prev => ({...prev, [packetId]: checked }));
  };
  
  const handleReassign = () => {
    if (!fromOperator || !toOperator) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select both "From" and "To" operators.' });
      return;
    }
    if (fromOperator === toOperator) {
        toast({ variant: 'destructive', title: 'Error', description: '"From" and "To" operators cannot be the same.' });
        return;
    }
    const packetIdsToReassign = Object.keys(selectedPackets).filter(id => selectedPackets[id]);
    if (packetIdsToReassign.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one packet to reassign.' });
      return;
    }

    const updatedPackets = sarinPackets.map(p => {
      if (packetIdsToReassign.includes(p.id)) {
        return { ...p, operator: toOperator };
      }
      return p;
    });

    const newLog: ReassignLog = {
      id: uuidv4(),
      date: new Date().toISOString(),
      fromOperator,
      toOperator,
      packets: sarinPackets.filter(p => packetIdsToReassign.includes(p.id)).map(p => ({ mainPacketNumber: p.mainPacketNumber, lotNumber: p.lotNumber }))
    };

    setSarinPackets(updatedPackets);
    setReassignLogs([...reassignLogs, newLog]);
    toast({ title: 'Success', description: `${packetIdsToReassign.length} packet(s) reassigned successfully.` });
    setSelectedPackets({});
    // Resetting selectors could be added if desired
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Packet Reassignment" description="Move Sarin packets between operators." />
      <Card>
        <CardHeader>
          <CardTitle>Reassign Packets</CardTitle>
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="text-sm font-medium">From Operator</label>
              <Select onValueChange={setFromOperator} value={fromOperator}>
                <SelectTrigger><SelectValue placeholder="Select source operator" /></SelectTrigger>
                <SelectContent>{sarinOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">To Operator</label>
              <Select onValueChange={setToOperator} value={toOperator}>
                <SelectTrigger><SelectValue placeholder="Select destination operator" /></SelectTrigger>
                <SelectContent>{sarinOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Available Packets for {fromOperator || '...'}</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox onCheckedChange={handleSelectAll} />
                  </TableHead>
                  <TableHead>Main Packet #</TableHead>
                  <TableHead>Lot #</TableHead>
                  <TableHead>Kapan #</TableHead>
                  <TableHead>Packet Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availablePackets.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox checked={!!selectedPackets[p.id]} onCheckedChange={(checked) => handleSelectPacket(p.id, !!checked)} />
                    </TableCell>
                    <TableCell>{p.mainPacketNumber}</TableCell>
                    <TableCell>{p.lotNumber}</TableCell>
                    <TableCell>{p.kapanNumber}</TableCell>
                    <TableCell>{p.packetCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {availablePackets.length === 0 && <p className="text-center text-muted-foreground p-4">No available packets for this operator.</p>}
          </div>
          <Button onClick={handleReassign} className="mt-4">Reassign Selected Packets</Button>
        </CardContent>
      </Card>
    </div>
  );
}

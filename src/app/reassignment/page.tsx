'use client';
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY, REASSIGN_LOGS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator, ReassignLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type TransferSelection = {
  type: 'full' | 'partial';
  quantity: number;
};

export default function ReassignmentPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [reassignLogs, setReassignLogs] = useLocalStorage<ReassignLog[]>(REASSIGN_LOGS_KEY, []);
  const [fromOperator, setFromOperator] = useState<string>('');
  const [toOperator, setToOperator] = useState<string>('');
  const [selectedPackets, setSelectedPackets] = useState<Record<string, TransferSelection>>({});
  const { toast } = useToast();

  const availablePackets = useMemo(() => {
    if (!fromOperator) return [];
    return sarinPackets.filter(p => p.operator === fromOperator && !p.isReturned && p.packetCount > 0);
  }, [fromOperator, sarinPackets]);

  const handleSelectionChange = (packetId: string, packet: SarinPacket, type: 'full' | 'partial', quantity?: number) => {
    if (type === 'none') {
        const newSelection = {...selectedPackets};
        delete newSelection[packetId];
        setSelectedPackets(newSelection);
        return;
    }

    const numQuantity = quantity || 0;
    if (type === 'partial' && (numQuantity <= 0 || numQuantity > packet.packetCount)) {
        toast({ variant: 'destructive', title: 'Invalid quantity', description: `Must be between 1 and ${packet.packetCount}` });
        const newSelection = {...selectedPackets};
        delete newSelection[packetId];
        setSelectedPackets(newSelection);
        return;
    }

    setSelectedPackets(prev => ({
      ...prev,
      [packetId]: {
        type: type,
        quantity: type === 'full' ? packet.packetCount : numQuantity,
      }
    }));
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
    const packetIdsToReassign = Object.keys(selectedPackets);
    if (packetIdsToReassign.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one packet to reassign.' });
      return;
    }
    
    const newPackets: SarinPacket[] = [];
    const updatedPackets = [...sarinPackets];
    const reassignedPacketInfo: { mainPacketNumber: string, lotNumber: string, quantity: number }[] = [];

    for (const packetId of packetIdsToReassign) {
      const selection = selectedPackets[packetId];
      if (!selection || selection.quantity <= 0) continue;

      const originalPacketIndex = updatedPackets.findIndex(p => p.id === packetId);
      if (originalPacketIndex === -1) continue;

      const originalPacket = updatedPackets[originalPacketIndex];
      reassignedPacketInfo.push({ mainPacketNumber: originalPacket.mainPacketNumber, lotNumber: originalPacket.lotNumber, quantity: selection.quantity });

      if (selection.type === 'full') {
        updatedPackets[originalPacketIndex] = { ...originalPacket, operator: toOperator };
      } else { // partial
        updatedPackets[originalPacketIndex].packetCount -= selection.quantity;
        
        const newPacketForToOperator: SarinPacket = {
          ...originalPacket,
          id: uuidv4(),
          operator: toOperator,
          packetCount: selection.quantity,
          date: new Date().toISOString(),
          time: new Date().toLocaleTimeString(),
        };
        newPackets.push(newPacketForToOperator);
      }
    }

    const finalPackets = [...updatedPackets, ...newPackets];

    const newLog: ReassignLog = {
      id: uuidv4(),
      date: new Date().toISOString(),
      fromOperator,
      toOperator,
      packets: reassignedPacketInfo.map(p => ({
        mainPacketNumber: p.mainPacketNumber,
        lotNumber: p.lotNumber,
        quantityTransferred: p.quantity,
      })),
    };

    setSarinPackets(finalPackets);
    setReassignLogs([...reassignLogs, newLog]);
    toast({ title: 'Success', description: `${reassignedPacketInfo.length} transfer(s) completed successfully.` });
    setSelectedPackets({});
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
              <Select onValueChange={(value) => { setFromOperator(value); setSelectedPackets({}); }} value={fromOperator}>
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
                  <TableHead>Packet Details</TableHead>
                  <TableHead className="w-[400px]">Transfer Option</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availablePackets.map(p => (
                  <TableRow key={p.id} className="align-top">
                    <TableCell>
                      <div className="font-medium">{p.mainPacketNumber}</div>
                      <div>Lot: {p.lotNumber} | Kapan: {p.kapanNumber}</div>
                      <div className="text-sm text-muted-foreground">Packets: {p.packetCount}</div>
                    </TableCell>
                    <TableCell>
                      <RadioGroup 
                        value={selectedPackets[p.id]?.type || 'none'} 
                        onValueChange={(type) => handleSelectionChange(p.id, p, type as 'full' | 'partial' | 'none')}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id={`none-${p.id}`} />
                            <Label htmlFor={`none-${p.id}`} className="font-normal">Don't Transfer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full" id={`full-${p.id}`} />
                          <Label htmlFor={`full-${p.id}`} className="font-normal">✅ Transfer Full Entry</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partial" id={`partial-${p.id}`} />
                          <Label htmlFor={`partial-${p.id}`} className="font-normal">✍️ Partial Transfer</Label>
                        </div>
                      </RadioGroup>
                      {selectedPackets[p.id]?.type === 'partial' && (
                        <div className="mt-2 pl-6">
                            <Input 
                                type="number" 
                                placeholder="No. of packets"
                                className="h-8"
                                max={p.packetCount}
                                min="1"
                                onChange={(e) => handleSelectionChange(p.id, p, 'partial', parseInt(e.target.value))}
                            />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {availablePackets.length === 0 && <p className="text-center text-muted-foreground p-4">No available packets for this operator.</p>}
          </div>
          <Button onClick={handleReassign} className="mt-4" disabled={Object.keys(selectedPackets).length === 0}>Reassign Selected Packets</Button>
        </CardContent>
      </Card>
    </div>
  );
}

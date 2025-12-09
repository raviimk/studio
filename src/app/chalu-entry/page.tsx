'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, CHALU_SARIN_PROGRESS_KEY } from '@/lib/constants';
import { SarinPacket } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ChaluProgress = {
  [packetId: string]: number;
}

export default function ChaluEntryPage() {
  const { toast } = useToast();
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [chaluProgress, setChaluProgress] = useLocalStorage<ChaluProgress>(CHALU_SARIN_PROGRESS_KEY, {});

  const [selectedKapan, setSelectedKapan] = useState('');
  const [selectedPacketId, setSelectedPacketId] = useState('');
  const [adjustmentValue, setAdjustmentValue] = useState('');

  const activePackets = useMemo(() => {
    return sarinPackets.filter(p => !p.isReturned);
  }, [sarinPackets]);

  const kapanOptions = useMemo(() => {
    const kapans = new Set(activePackets.map(p => p.kapanNumber));
    return Array.from(kapans).sort((a,b) => parseInt(a) - parseInt(b));
  }, [activePackets]);
  
  const packetOptions = useMemo(() => {
    if (!selectedKapan) return [];
    return activePackets.filter(p => p.kapanNumber === selectedKapan);
  }, [activePackets, selectedKapan]);

  const selectedPacket = useMemo(() => {
    return activePackets.find(p => p.id === selectedPacketId);
  }, [activePackets, selectedPacketId]);
  
  const originalCount = selectedPacket?.packetCount ?? 0;
  const progressCount = selectedPacketId ? (chaluProgress[selectedPacketId] || 0) : 0;
  const currentCount = originalCount - progressCount;

  useEffect(() => {
    // Reset packet selection if kapan changes
    setSelectedPacketId('');
    setAdjustmentValue('');
  }, [selectedKapan]);
  
  useEffect(() => {
    if (selectedPacketId) {
       const savedProgress = chaluProgress[selectedPacketId] || 0;
       setAdjustmentValue(savedProgress > 0 ? String(savedProgress) : '');
    } else {
       setAdjustmentValue('');
    }
  }, [selectedPacketId, chaluProgress]);


  const handleSave = () => {
    if (!selectedPacketId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a packet.' });
      return;
    }
    const valueToSave = parseInt(adjustmentValue, 10);

    if (isNaN(valueToSave) || valueToSave < 0) {
      toast({ variant: 'destructive', title: 'Invalid Value', description: 'Please enter a valid positive number for packets made.' });
      return;
    }
    
    if (valueToSave > originalCount) {
       toast({ variant: 'destructive', title: 'Invalid Value', description: `Cannot exceed original packet count of ${originalCount}.` });
      return;
    }
    
    setChaluProgress(prev => ({
        ...prev,
        [selectedPacketId]: valueToSave
    }));
    
    toast({ title: 'Progress Saved', description: `Saved ${valueToSave} packets for Lot ${selectedPacket?.lotNumber}.`});
  };

  const getRemainingCount = (packet: SarinPacket) => {
      const original = packet.packetCount;
      const progress = chaluProgress[packet.id] || 0;
      return original - progress;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Chalu / Running Packet Entry" description="Log progress on active Sarin lots." />
      
      <Card>
        <CardHeader>
          <CardTitle>Log Production Progress</CardTitle>
          <CardDescription>Select a lot and enter the number of packets completed today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">Kapan Number</label>
              <Select value={selectedKapan} onValueChange={setSelectedKapan}>
                <SelectTrigger><SelectValue placeholder="Select Kapan" /></SelectTrigger>
                <SelectContent>{kapanOptions.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">Lot Number</label>
               <Select value={selectedPacketId} onValueChange={setSelectedPacketId} disabled={!selectedKapan}>
                <SelectTrigger><SelectValue placeholder="Select Lot" /></SelectTrigger>
                <SelectContent>
                  {packetOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.lotNumber} ({p.operator})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Original PCS</label>
              <Input value={originalCount} readOnly disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Today's PCS Made</label>
              <Input 
                type="number" 
                value={adjustmentValue} 
                onChange={(e) => setAdjustmentValue(e.target.value)}
                placeholder="Enter count"
                disabled={!selectedPacketId}
              />
            </div>
             <div>
              <label className="text-sm font-medium">Remaining PCS</label>
              <Input 
                value={currentCount - (parseInt(adjustmentValue) || 0)} 
                readOnly 
                disabled 
                className="font-bold text-lg"
              />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4" disabled={!selectedPacketId}>
            <Save className="mr-2" /> Save Progress
          </Button>
          
           {selectedPacket && getRemainingCount(selectedPacket) < 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning: Count Mismatch</AlertTitle>
                  <AlertDescription>
                    The total packets made ({chaluProgress[selectedPacketId] || 0}) exceeds the original packet count ({selectedPacket.packetCount}). The remaining count is negative. Please review your entries.
                  </AlertDescription>
                </Alert>
            )}

        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Active Lot Summary</CardTitle>
              <CardDescription>Overview of all active lots and their current progress.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Kapan / Lot</TableHead>
                          <TableHead>Operator</TableHead>
                          <TableHead>Entry Date</TableHead>
                          <TableHead>Original PCS</TableHead>
                          <TableHead>Completed PCS</TableHead>
                          <TableHead>Remaining PCS</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {activePackets.sort((a,b) => parseInt(a.kapanNumber) - parseInt(b.kapanNumber) || parseInt(a.lotNumber) - parseInt(b.lotNumber)).map(p => (
                          <TableRow key={p.id}>
                              <TableCell>
                                <div className="font-medium">{p.kapanNumber} / {p.lotNumber}</div>
                              </TableCell>
                              <TableCell>{p.operator}</TableCell>
                              <TableCell>{format(new Date(p.date), 'PP')}</TableCell>
                              <TableCell>{p.packetCount}</TableCell>
                              <TableCell className="font-semibold">{chaluProgress[p.id] || 0}</TableCell>
                              <TableCell className="font-bold">{getRemainingCount(p)}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}

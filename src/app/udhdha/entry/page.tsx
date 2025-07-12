
'use client';
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UHDHA_PACKETS_KEY, UHDHA_SETTINGS_KEY, SARIN_OPERATORS_KEY, LASER_OPERATORS_KEY } from '@/lib/constants';
import { UdhdaPacket, UdhdaSettings, SarinOperator, LaserOperator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, Clock, Diamond, Gem, Send } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, formatDistanceToNowStrict, isBefore, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function UdhdaEntryPage() {
  const { toast } = useToast();
  const [udhdhaPackets, setUdhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
  const [settings] = useLocalStorage<UdhdaSettings>(UHDHA_SETTINGS_KEY, { returnTimeLimitMinutes: 60 });
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);

  const [barcode, setBarcode] = useState('');
  const [scannedPacket, setScannedPacket] = useState<string | null>(null);
  const [processType, setProcessType] = useState<'sarin' | 'laser' | ''>('');
  const [selectedOperator, setSelectedOperator] = useState('');
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    const existingPacket = udhdhaPackets.find(p => p.barcode === barcode && !p.isReturned);

    if (existingPacket) {
      toast({ variant: 'destructive', title: 'Packet Already Assigned', description: `This packet is already assigned to ${existingPacket.operator}. Please use the Udhda Return page.` });
      setBarcode('');
      return;
    }
    
    const returnedPacket = udhdhaPackets.find(p => p.barcode === barcode && p.isReturned);
     if (returnedPacket) {
      toast({ variant: 'destructive', title: 'Packet Already Returned', description: `This packet was already processed and returned.` });
      setBarcode('');
      return;
    }

    // This is a new assignment
    setScannedPacket(barcode);
  };
  
  const handleAssignPacket = () => {
    if (!scannedPacket || !processType || !selectedOperator) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a process type and an operator.' });
      return;
    }

    const newPacket: UdhdaPacket = {
      id: uuidv4(),
      barcode: scannedPacket,
      type: processType,
      operator: selectedOperator,
      assignmentTime: new Date().toISOString(),
      isReturned: false,
    };

    setUdhdhaPackets([...udhdhaPackets, newPacket]);
    toast({ title: 'Packet Assigned', description: `Assigned ${scannedPacket} to ${selectedOperator}.` });

    // Reset form
    setBarcode('');
    setScannedPacket(null);
    setProcessType('');
    setSelectedOperator('');
  };

  const pendingPackets = udhdhaPackets.filter(p => !p.isReturned).sort((a,b) => new Date(b.assignmentTime).getTime() - new Date(a.assignmentTime).getTime());
  const operatorList = processType === 'sarin' ? sarinOperators : laserOperators;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Udhda Entry" description="Assign individual packets to an operator." />

      <Card>
        <CardHeader>
          <CardTitle>Assign New Packet</CardTitle>
          <CardDescription>Scan a barcode to begin the assignment process.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBarcodeScan} className="flex gap-2 max-w-sm">
            <Input
              placeholder="Scan barcode..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              disabled={!!scannedPacket}
            />
            <Button type="submit" disabled={!!scannedPacket || !barcode}>
              <Barcode className="mr-2 h-4 w-4" /> Scan
            </Button>
          </form>

          {scannedPacket && (
            <div className="mt-6 space-y-6 animate-in fade-in-50">
              <p className="text-sm font-semibold">Assigning new packet: <span className="font-mono text-primary">{scannedPacket}</span></p>
              
              <div className="space-y-2">
                <Label>Step 1: Select Process Type</Label>
                <RadioGroup value={processType} onValueChange={(val) => { setProcessType(val as 'sarin' | 'laser'); setSelectedOperator('')}} className="flex gap-4">
                   <Label htmlFor="type-sarin" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary">
                       <RadioGroupItem value="sarin" id="type-sarin" /> <Diamond className="h-4 w-4" /> Sarin
                    </Label>
                    <Label htmlFor="type-laser" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary">
                       <RadioGroupItem value="laser" id="type-laser" /> <Gem className="h-4 w-4" /> Laser
                    </Label>
                </RadioGroup>
              </div>

              {processType && (
                 <div className="space-y-2 max-w-sm">
                    <Label>Step 2: Select Operator</Label>
                    <Select onValueChange={setSelectedOperator} value={selectedOperator}>
                        <SelectTrigger><SelectValue placeholder={`Select ${processType} operator`} /></SelectTrigger>
                        <SelectContent>{operatorList.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleAssignPacket} disabled={!processType || !selectedOperator}>
                  <Send className="mr-2 h-4 w-4" /> Assign Packet
                </Button>
                <Button variant="outline" onClick={() => { setScannedPacket(null); setBarcode(''); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Return Packets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned Time</TableHead>
                  <TableHead>Time Elapsed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPackets.map(p => {
                    const assignedAt = new Date(p.assignmentTime);
                    const deadline = addMinutes(assignedAt, settings.returnTimeLimitMinutes);
                    const isOverdue = isBefore(deadline, now);
                  
                  return (
                    <TableRow key={p.id} className={cn(isOverdue && 'bg-destructive/10')}>
                      <TableCell className="font-mono">{p.barcode}</TableCell>
                      <TableCell><Badge variant="secondary">{p.operator}</Badge></TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>{format(assignedAt, 'PPp')}</TableCell>
                      <TableCell className={cn('flex items-center gap-2', isOverdue && 'font-bold text-destructive')}>
                         <Clock className="h-4 w-4"/> {formatDistanceToNowStrict(assignedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pendingPackets.length === 0 && (
                   <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No packets are pending return.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

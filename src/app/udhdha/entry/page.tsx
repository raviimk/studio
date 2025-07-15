
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UHDHA_PACKETS_KEY, UHDHA_SETTINGS_KEY, SARIN_OPERATORS_KEY, LASER_OPERATORS_KEY } from '@/lib/constants';
import { UdhdaPacket, UdhdaSettings, SarinOperator, LaserOperator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, Clock, Diamond, Gem, Send, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, formatDistanceToNowStrict, isBefore, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function UdhdaEntryPage() {
  const { toast } = useToast();
  const [udhdhaPackets, setUdhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
  const [settings] = useLocalStorage<UdhdaSettings>(UHDHA_SETTINGS_KEY, { returnTimeLimitMinutes: 60 });
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);

  const [barcode, setBarcode] = useState('');
  const [scannedPackets, setScannedPackets] = useState<string[]>([]);
  const [processType, setProcessType] = useState<'sarin' | 'laser' | ''>('');
  const [selectedOperator, setSelectedOperator] = useState('');
  
  const [now, setNow] = useState(new Date());

  // State for re-entry confirmation dialog
  const [packetToReEnter, setPacketToReEnter] = useState<string | null>(null);
  const reEnterDialogTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const addPacketToList = (barcodeToAdd: string) => {
    setScannedPackets(prev => [...prev, barcodeToAdd]);
    setBarcode('');
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    if (scannedPackets.includes(barcode)) {
        toast({ variant: 'destructive', title: 'Duplicate Scan', description: `Barcode "${barcode}" is already in the list.` });
        setBarcode('');
        return;
    }

    const activePacket = udhdhaPackets.find(p => p.barcode === barcode && !p.isReturned);
    if (activePacket) {
      toast({ variant: 'destructive', title: 'Packet Already Assigned', description: `This packet is already active with ${activePacket.operator}. Use the Udhda Return page.` });
      setBarcode('');
      return;
    }
    
    const returnedPacket = udhdhaPackets.find(p => p.barcode === barcode && p.isReturned);
    if (returnedPacket) {
      setPacketToReEnter(barcode);
      reEnterDialogTriggerRef.current?.click();
      return;
    }

    addPacketToList(barcode);
  };
  
  const handleAssignPackets = () => {
    if (scannedPackets.length === 0 || !processType || !selectedOperator) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please scan at least one packet and select a process type and an operator.' });
      return;
    }
    
    const newPackets: UdhdaPacket[] = scannedPackets.map(scannedBarcode => ({
        id: uuidv4(),
        barcode: scannedBarcode,
        type: processType as 'sarin' | 'laser',
        operator: selectedOperator,
        assignmentTime: new Date().toISOString(),
        isReturned: false,
    }));

    setUdhdhaPackets([...udhdhaPackets, ...newPackets]);
    toast({ title: 'Packets Assigned', description: `Assigned ${newPackets.length} packets to ${selectedOperator}.` });

    // Reset form
    setBarcode('');
    setScannedPackets([]);
    setProcessType('');
    setSelectedOperator('');
  };

  const handleRemovePacket = (barcodeToRemove: string) => {
      setScannedPackets(prev => prev.filter(b => b !== barcodeToRemove));
  }
  
  const handleConfirmReEnter = () => {
    if (packetToReEnter) {
        addPacketToList(packetToReEnter);
    }
    setPacketToReEnter(null);
  };

  const handleCancelReEnter = () => {
    setPacketToReEnter(null);
    setBarcode('');
  };


  const pendingPackets = udhdhaPackets.filter(p => !p.isReturned).sort((a,b) => new Date(b.assignmentTime).getTime() - new Date(a.assignmentTime).getTime());
  const operatorList = processType === 'sarin' ? sarinOperators : laserOperators;

  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
        <PageHeader title="Udhda Entry (Batch)" description="Scan and assign multiple individual packets to an operator." />

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Scan Packets</CardTitle>
            <CardDescription>Scan all packet barcodes you want to assign in this batch.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBarcodeScan} className="flex gap-2 max-w-sm">
              <Input
                placeholder="Scan barcode..."
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
              />
              <Button type="submit" disabled={!barcode}>
                <Barcode className="mr-2 h-4 w-4" /> Add to List
              </Button>
            </form>
            
            {scannedPackets.length > 0 && (
              <div className="mt-6 space-y-4">
                  <h3 className="font-semibold">Scanned Packets for this Batch: {scannedPackets.length}</h3>
                   <div className="border rounded-md max-h-60 overflow-y-auto">
                      <Table>
                          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Barcode</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {scannedPackets.map((b, index) => (
                                  <TableRow key={b}>
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell className="font-mono">{b}</TableCell>
                                      <TableCell>
                                          <Button variant="ghost" size="icon" onClick={() => handleRemovePacket(b)}><Trash2 className="h-4 w-4"/></Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                   </div>
              </div>
            )}

            {scannedPackets.length > 0 && (
              <div className="mt-6 space-y-6 animate-in fade-in-50">
                <div className="space-y-2">
                  <Label>Step 2: Select Process Type</Label>
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
                      <Label>Step 3: Select Operator</Label>
                      <Select onValueChange={setSelectedOperator} value={selectedOperator}>
                          <SelectTrigger><SelectValue placeholder={`Select ${processType} operator`} /></SelectTrigger>
                          <SelectContent>{operatorList.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleAssignPackets} disabled={!processType || !selectedOperator}>
                    <Send className="mr-2 h-4 w-4" /> Assign {scannedPackets.length} Packets
                  </Button>
                  <Button variant="outline" onClick={() => { setScannedPackets([]); setBarcode(''); }}>Clear List</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Return Packets (All)</CardTitle>
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

       <AlertDialog>
          <AlertDialogTrigger asChild>
              <button ref={reEnterDialogTriggerRef} className="hidden">Open Re-enter Dialog</button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Re-enter Packet?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This packet was previously returned. Do you want to create a new entry for it? The old entry will be kept in the history.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleCancelReEnter}>No, Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmReEnter}>Yes, Create New Entry</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


'use client';

import React, { useEffect, useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, AlertTriangle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_MAPPINGS_KEY } from '@/lib/constants';
import { LaserLot, LaserMapping, ScannedPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const formSchema = z.object({
  lotNumber: z.string().min(1, 'Lot number is required'),
  kapanNumber: z.string().min(1, 'Kapan number is required'),
  tensionType: z.string().min(1, 'Tension type is required'),
  machine: z.string(),
  packetCount: z.coerce.number().min(1, 'Packet count must be at least 1'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewLaserLotPage() {
  const { toast } = useToast();
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserMappings] = useLocalStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [currentLotDetails, setCurrentLotDetails] = useState<FormValues | null>(null);
  const [scannedPackets, setScannedPackets] = useState<ScannedPacket[]>([]);
  const [barcode, setBarcode] = useState('');
  
  // State for Kapan mismatch dialog
  const [mismatchedPacket, setMismatchedPacket] = useState<ScannedPacket | null>(null);
  const kapanMismatchDialogTriggerRef = useRef<HTMLButtonElement>(null);
  
  // State for cross-lot duplicate dialog
  const [duplicatePacketInfo, setDuplicatePacketInfo] = useState<{ packet: ScannedPacket, existingLotNumber: string } | null>(null);
  const duplicateDialogTriggerRef = useRef<HTMLButtonElement>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lotNumber: '',
      kapanNumber: '',
      tensionType: '',
      machine: '',
      packetCount: 0,
    },
  });

  const selectedTension = form.watch('tensionType');
  
  useEffect(() => {
    if (selectedTension) {
      const mapping = laserMappings.find(m => m.tensionType === selectedTension);
      form.setValue('machine', mapping ? mapping.machine : 'N/A');
    }
  }, [selectedTension, laserMappings, form]);

  const handleInitialSubmit = (values: FormValues) => {
    setCurrentLotDetails(values);
    setFormSubmitted(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };
  
  const packetCount = currentLotDetails?.packetCount || 0;

  const handleAddPacket = (packet: ScannedPacket) => {
    if(scannedPackets.length >= packetCount) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: 'You have already scanned all packets for this lot.' });
        setBarcode('');
        return;
    }
    if (scannedPackets.some(p => p.fullBarcode === packet.fullBarcode)) {
        toast({ variant: 'destructive', title: 'Duplicate Packet', description: 'This packet has already been scanned for the current lot.' });
        setBarcode('');
        return;
    }
    setScannedPackets(prev => [...prev, packet]);
    setBarcode('');
  }

  const handleDeletePacket = (packetId: string) => {
    setScannedPackets(prev => prev.filter(p => p.id !== packetId));
    toast({ title: 'Packet Removed', description: 'The packet has been removed from the list.' });
  }

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !currentLotDetails) return;
    
    // Regex to handle both "61-102" and "R61-102-A" formats
    const match = barcode.match(/^(?:R)?(\d+)-(\d+)(?:-(.+))?$/);
    if (!match) {
        toast({ variant: 'destructive', title: 'Invalid Barcode Format', description: 'Expected "Kapan-Packet" or "R-Kapan-Packet-Suffix".' });
        return;
    }
    const [, kapan, packetNumber, suffix] = match;
    
    const newPacket: ScannedPacket = {
        id: uuidv4(),
        kapanNumber: kapan,
        packetNumber: packetNumber,
        suffix: suffix || '', // Store empty string if no suffix
        fullBarcode: barcode
    };

    // Cross-lot duplicate check in *unreturned* lots
    const existingLot = laserLots.find(lot => !lot.isReturned && lot.scannedPackets?.some(p => p.fullBarcode === barcode));
    if (existingLot) {
        setDuplicatePacketInfo({ packet: newPacket, existingLotNumber: existingLot.lotNumber });
        duplicateDialogTriggerRef.current?.click();
        return;
    }

    // Kapan mismatch check
    if (kapan !== currentLotDetails.kapanNumber) {
        setMismatchedPacket(newPacket);
        kapanMismatchDialogTriggerRef.current?.click();
        return;
    }
    
    handleAddPacket(newPacket);
  };
  
  const proceedWithPacket = (packet: ScannedPacket | null) => {
      if (!packet || !currentLotDetails) return;
       // Re-check for kapan mismatch after duplicate confirmation
       if (packet.kapanNumber !== currentLotDetails.kapanNumber) {
            setMismatchedPacket(packet);
            kapanMismatchDialogTriggerRef.current?.click();
       } else {
            handleAddPacket(packet);
       }
  }

  // Dialog actions
  const addMismatchedPacket = () => {
    if (mismatchedPacket) {
        handleAddPacket(mismatchedPacket);
    }
    setMismatchedPacket(null);
  }

  const ignoreMismatchedPacket = () => {
    setMismatchedPacket(null);
    setBarcode('');
    barcodeInputRef.current?.focus();
  }

  const addDuplicatePacket = () => {
      if (duplicatePacketInfo) {
          proceedWithPacket(duplicatePacketInfo.packet);
      }
      setDuplicatePacketInfo(null);
  }

  const ignoreDuplicatePacket = () => {
      setDuplicatePacketInfo(null);
      setBarcode('');
      barcodeInputRef.current?.focus();
  }


  function createFinalLot() {
     if (!currentLotDetails || scannedPackets.length !== currentLotDetails.packetCount) {
        toast({ variant: 'destructive', title: 'Packet Count Mismatch', description: `Expected ${currentLotDetails?.packetCount} packets, but found ${scannedPackets.length}.` });
        return;
    }

    const newLot: LaserLot = {
      id: uuidv4(),
      ...currentLotDetails,
      scannedPackets,
      entryDate: new Date().toISOString(),
      isReturned: false,
    };
    setLaserLots([...laserLots, newLot]);
    toast({ title: 'Success', description: 'New laser lot has been created.' });
    
    // Reset state
    form.reset();
    setFormSubmitted(false);
    setScannedPackets([]);
    setBarcode('');
    setCurrentLotDetails(null);
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="New Laser Lot" description="Create a new entry for a laser lot." />
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Step 1: Lot Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="lotNumber" render={({ field }) => (
                    <FormItem><FormLabel>Lot Number</FormLabel><FormControl><Input {...field} disabled={formSubmitted} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="kapanNumber" render={({ field }) => (
                    <FormItem><FormLabel>Kapan Number</FormLabel><FormControl><Input {...field} disabled={formSubmitted} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tensionType" render={({ field }) => (
                    <FormItem><FormLabel>Tension Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={formSubmitted}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select tension type" /></SelectTrigger></FormControl>
                            <SelectContent>{laserMappings.map(map => (<SelectItem key={map.id} value={map.tensionType}>{map.tensionType}</SelectItem>))}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="machine" render={({ field }) => (
                    <FormItem><FormLabel>Machine Name</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="packetCount" render={({ field }) => (
                    <FormItem><FormLabel>Packet Count</FormLabel><FormControl><Input type="number" {...field} disabled={formSubmitted} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              {!formSubmitted && <Button type="submit">Next: Scan Packets</Button>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {formSubmitted && currentLotDetails && (
        <Card className="max-w-4xl mx-auto mt-8">
            <CardHeader><CardTitle>Step 2: Scan Packets</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleBarcodeScan} className="flex gap-2 mb-4">
                    <Input 
                        ref={barcodeInputRef}
                        placeholder="Scan barcode..."
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        disabled={scannedPackets.length >= packetCount}
                    />
                    <Button type="submit" disabled={scannedPackets.length >= packetCount || !barcode}>
                        <Barcode className="mr-2 h-4 w-4" /> Add
                    </Button>
                </form>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Scanned Barcode</TableHead>
                                <TableHead>Kapan</TableHead>
                                <TableHead>Packet #</TableHead>
                                <TableHead>Suffix</TableHead>
                                <TableHead className="w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: packetCount }).map((_, index) => {
                                const packet = scannedPackets[index];
                                return (
                                    <TableRow key={index} className={packet ? '' : 'bg-muted/50'}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{packet?.fullBarcode || '...'}</TableCell>
                                        <TableCell>{packet?.kapanNumber || '...'}</TableCell>
                                        <TableCell>{packet?.packetNumber || '...'}</TableCell>
                                        <TableCell>{packet?.suffix || 'Main'}</TableCell>
                                        <TableCell className="text-right">
                                            {packet && (
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePacket(packet.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground font-semibold">
                        Scanned: {scannedPackets.length} / {packetCount}
                    </p>
                    <Button onClick={createFinalLot} disabled={scannedPackets.length !== packetCount}>
                        Create Laser Lot
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {/* Kapan Mismatch Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
            <button ref={kapanMismatchDialogTriggerRef} className="hidden">Open Kapan Mismatch Dialog</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2'>
                    <AlertTriangle className="text-yellow-500" /> Kapan Mismatch
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Scanned packet belongs to Kapan <span className="font-bold">{mismatchedPacket?.kapanNumber}</span>.
                    Your current lot's Kapan is <span className="font-bold">{currentLotDetails?.kapanNumber}</span>.
                    <br />
                    Do you want to add this packet anyway?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={ignoreMismatchedPacket}>No, Ignore</AlertDialogCancel>
                <AlertDialogAction onClick={addMismatchedPacket}>Yes, Add Anyway</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cross-Lot Duplicate Dialog */}
       <AlertDialog>
        <AlertDialogTrigger asChild>
            <button ref={duplicateDialogTriggerRef} className="hidden">Open Duplicate Dialog</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2'>
                    <AlertTriangle className="text-yellow-500" /> Duplicate Packet Found
                </AlertDialogTitle>
                <AlertDialogDescription>
                    This packet (<span className="font-bold font-mono">{duplicatePacketInfo?.packet.fullBarcode}</span>) is already in an active lot (<span className="font-bold">{duplicatePacketInfo?.existingLotNumber}</span>).
                    <br />
                    Are you sure you want to add it again to this new lot?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={ignoreDuplicatePacket}>No, Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={addDuplicatePacket}>Yes, Add Anyway</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

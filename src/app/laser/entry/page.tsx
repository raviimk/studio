
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, AlertTriangle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  const [scannedPackets, setScannedPackets] = useState<ScannedPacket[]>([]);
  const [barcode, setBarcode] = useState('');
  const [mismatchedPacket, setMismatchedPacket] = useState<ScannedPacket | null>(null);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const alertDialogTriggerRef = useRef<HTMLButtonElement>(null);


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
  const packetCount = form.watch('packetCount');

  useEffect(() => {
    if (selectedTension) {
      const mapping = laserMappings.find(m => m.tensionType === selectedTension);
      form.setValue('machine', mapping ? mapping.machine : 'N/A');
    }
  }, [selectedTension, laserMappings, form]);

  const handleInitialSubmit = (values: FormValues) => {
    setFormSubmitted(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const handleAddPacket = (packet: ScannedPacket) => {
    if(scannedPackets.length >= packetCount) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: 'You have already scanned all packets for this lot.' });
        return;
    }
    if (scannedPackets.some(p => p.fullBarcode === packet.fullBarcode)) {
        toast({ variant: 'destructive', title: 'Duplicate Packet', description: 'This packet has already been scanned.' });
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
    if (!barcode) return;

    const match = barcode.match(/^R(\d+)-(\d+)-(.+)$/);
    if (!match) {
        toast({ variant: 'destructive', title: 'Invalid Barcode', description: 'Format must be R{Kapan}-{Packet}-{Suffix}.' });
        return;
    }
    const [, kapan, packetNumber, suffix] = match;
    
    const newPacket: ScannedPacket = {
        id: uuidv4(),
        kapanNumber: kapan,
        packetNumber,
        suffix,
        fullBarcode: barcode
    };

    if (kapan === form.getValues('kapanNumber')) {
        handleAddPacket(newPacket);
    } else {
        setMismatchedPacket(newPacket);
        alertDialogTriggerRef.current?.click();
    }
  };

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

  function createFinalLot() {
     if (scannedPackets.length !== packetCount) {
        toast({ variant: 'destructive', title: 'Packet Count Mismatch', description: `Expected ${packetCount} packets, but found ${scannedPackets.length}.` });
        return;
    }

    const newLot: LaserLot = {
      id: uuidv4(),
      ...form.getValues(),
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

      {formSubmitted && (
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
                                        <TableCell>{packet?.suffix || '...'}</TableCell>
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

      <AlertDialog>
        <AlertDialogTrigger asChild>
            <button ref={alertDialogTriggerRef} className="hidden">Open Dialog</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2'>
                    <AlertTriangle className="text-yellow-500" /> Kapan Mismatch
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Scanned packet belongs to Kapan <span className="font-bold">{mismatchedPacket?.kapanNumber}</span>.
                    Your current lot's Kapan is <span className="font-bold">{form.getValues('kapanNumber')}</span>.
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

    </div>
  );
}

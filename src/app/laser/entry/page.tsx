
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, AlertTriangle, Trash2, Sparkles, PackagePlus, Check, Pencil, Timer } from 'lucide-react';
import { isSameMonth, startOfMonth, isToday, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_MAPPINGS_KEY, SYSTEM_SETTINGS_KEY } from '@/lib/constants';
import { LaserLot, LaserMapping, ScannedPacket, SystemSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import LotSeriesViewer from '@/components/LotSeriesViewer';
import LotDetailPopup from '@/components/LotDetailPopup';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formSchema = z.object({
  lotNumber: z.string().min(1, 'Lot number is required'),
  kapanNumber: z.string().min(1, 'Kapan number is required'),
  tensionType: z.string().min(1, 'Tension type is required'),
  machine: z.string(),
  packetCount: z.coerce.number().min(1, 'Packet count must be at least 1'),
});

type FormValues = z.infer<typeof formSchema>;

const LargeDiamondIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>diamond</title>
        <path d="M2.103 12.052l13.398 16.629-5.373-16.629h-8.025zM11.584 12.052l4.745 16.663 4.083-16.663h-8.828zM17.051 28.681l12.898-16.629h-7.963l-4.935 16.629zM29.979 10.964l-3.867-6.612-3.869 6.612h7.736zM24.896 3.973h-7.736l3.867 6.839 3.869-6.839zM19.838 10.964l-3.867-6.612-3.868 6.612h7.735zM14.839 3.973h-7.735l3.868 6.839 3.867-6.839zM5.889 4.352l-3.867 6.612h7.735l-3.868-6.612z"></path>
    </svg>
);


export default function NewLaserLotPage() {
  const { toast } = useToast();
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserMappings] = useLocalStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);
  const [systemSettings] = useLocalStorage<SystemSettings>(SYSTEM_SETTINGS_KEY, { youtubeLink: '', autoCreateLaserLot: false, autoCreateLaserLotDelay: 10 });


  const [formSubmitted, setFormSubmitted] = useState(false);
  const [currentLotDetails, setCurrentLotDetails] = useState<FormValues | null>(null);
  const [scannedPackets, setScannedPackets] = useState<ScannedPacket[]>([]);
  const [barcode, setBarcode] = useState('');
  
  const [mismatchedPacket, setMismatchedPacket] = useState<ScannedPacket | null>(null);
  const kapanMismatchDialogTriggerRef = useRef<HTMLButtonElement>(null);
  
  const [duplicatePacketInfo, setDuplicatePacketInfo] = useState<{ packet: ScannedPacket, existingLotNumber: string } | null>(null);
  const duplicateDialogTriggerRef = useRef<HTMLButtonElement>(null);

  const [lastCompletedLot, setLastCompletedLot] = useState<number | null>(null);
  
  const [viewingLot, setViewingLot] = useState<LaserLot | null>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);


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

  const { watch } = form;
  const currentLotNumberStr = watch('lotNumber');
  const machineName = watch('machine');

  const todaysStats = useMemo(() => {
    if (!laserLots) return { createdLots: 0, returnedLots: 0, operatorSummary: [] };
    
    let createdLots = 0;
    let returnedLots = 0;
    const operatorSummary: Record<string, { operator: string, pcs: number }> = {};

    laserLots.forEach(lot => {
        if (isToday(parseISO(lot.entryDate))) {
            createdLots++;
        }
        if (lot.isReturned && lot.returnDate && isToday(parseISO(lot.returnDate))) {
            returnedLots++;
            if (lot.returnedBy) {
                 if (!operatorSummary[lot.returnedBy]) {
                    operatorSummary[lot.returnedBy] = { operator: lot.returnedBy, pcs: 0 };
                }
                operatorSummary[lot.returnedBy].pcs += lot.subPacketCount ?? lot.packetCount;
            }
        }
    });
    
    return { 
        createdLots, 
        returnedLots,
        operatorSummary: Object.values(operatorSummary).sort((a,b) => b.pcs - a.pcs)
    };
  }, [laserLots]);
  
  const handleTensionChange = (value: string) => {
    form.setValue('tensionType', value);
    const mapping = laserMappings.find(m => m.tensionType === value);
    form.setValue('machine', mapping ? mapping.machine : 'N/A');
  };
  
  const currentPacketCount = formSubmitted ? currentLotDetails?.packetCount || 0 : watch('packetCount') || 0;

  const handleInitialSubmit = (values: FormValues) => {
    const existingLot = laserLots.find(
      (lot) => isSameMonth(new Date(lot.entryDate), new Date()) && lot.lotNumber === values.lotNumber
    );

    if (existingLot) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Lot Number',
        description: `Lot Number ${values.lotNumber} already exists for the current month.`,
      });
      return;
    }

    setCurrentLotDetails(values);
    setFormSubmitted(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };
  
  
  const handleAddPacket = (packet: ScannedPacket) => {
    if(scannedPackets.length >= currentPacketCount) {
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
        suffix: suffix || '',
        fullBarcode: barcode
    };

    const existingLot = laserLots.find(lot => !lot.isReturned && lot.scannedPackets?.some(p => p.fullBarcode === barcode));
    if (existingLot) {
        setDuplicatePacketInfo({ packet: newPacket, existingLotNumber: existingLot.lotNumber });
        duplicateDialogTriggerRef.current?.click();
        return;
    }

    if (kapan !== currentLotDetails.kapanNumber) {
        setMismatchedPacket(newPacket);
        kapanMismatchDialogTriggerRef.current?.click();
        return;
    }
    
    handleAddPacket(newPacket);
  };
  
  const proceedWithPacket = (packet: ScannedPacket | null) => {
      if (!packet || !currentLotDetails) return;
       if (packet.kapanNumber !== currentLotDetails.kapanNumber) {
            setMismatchedPacket(packet);
            kapanMismatchDialogTriggerRef.current?.click();
       } else {
            handleAddPacket(packet);
       }
  }

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

  const createFinalLot = React.useCallback(() => {
     if (!currentLotDetails) return;

    if (scannedPackets.length !== currentLotDetails.packetCount) {
        toast({ variant: 'destructive', title: 'Packet Count Mismatch', description: `Expected ${currentLotDetails.packetCount} packets, but found ${scannedPackets.length}.` });
        return;
    }

    const newLot: LaserLot = {
      id: uuidv4(),
      ...currentLotDetails,
      packetCount: currentLotDetails.packetCount,
      scannedPackets,
      entryDate: new Date().toISOString(),
      isReturned: false,
    };
    setLaserLots(prev => [...prev, newLot]);
    setLastCompletedLot(parseInt(newLot.lotNumber, 10)); // Trigger animation
    toast({ title: 'Success', description: 'New laser lot has been created.' });
    
    form.reset();
    setFormSubmitted(false);
    setScannedPackets([]);
    setBarcode('');
    setCurrentLotDetails(null);
    setCountdown(null);
  }, [currentLotDetails, form, laserLots, setLaserLots, scannedPackets, toast]);

  useEffect(() => {
    if (scannedPackets.length > 0 && currentPacketCount > 0 && scannedPackets.length === currentPacketCount) {
        if(systemSettings.autoCreateLaserLot) {
            setCountdown(systemSettings.autoCreateLaserLotDelay || 10);
        }
    } else {
        setCountdown(null);
    }
  }, [scannedPackets, currentPacketCount, systemSettings]);
  
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }
    if (countdown === 0) {
        createFinalLot();
    }
  }, [countdown, createFinalLot]);


  const { lotSeries, completedLots, nextLot } = React.useMemo(() => {
    const today = new Date();
    const lotsThisMonth = laserLots
      .filter(lot => isSameMonth(new Date(lot.entryDate), today))
      .map(lot => parseInt(lot.lotNumber, 10))
      .filter(num => !isNaN(num));

    const completed = new Set(lotsThisMonth);
    const maxCompleted = lotsThisMonth.length > 0 ? Math.max(...lotsThisMonth) : 0;
    
    const currentLotNum = parseInt(currentLotNumberStr, 10);
    const highestNum = Math.max(maxCompleted, isNaN(currentLotNum) ? 0 : currentLotNum);

    const seriesEnd = Math.max(1, highestNum + 5);
    const series = Array.from({ length: seriesEnd }, (_, i) => i + 1);

    let nextLotNumber: number | null = 1;
    while(completed.has(nextLotNumber!)) {
        nextLotNumber!++;
    }

    return {
        lotSeries: series,
        completedLots: completed,
        nextLot: nextLotNumber
    }
  }, [laserLots, currentLotNumberStr]);

  const handleLotClick = (lotNumber: number) => {
    const lot = laserLots.find(l => parseInt(l.lotNumber, 10) === lotNumber && isSameMonth(new Date(l.entryDate), new Date()));
    setViewingLot(lot || null);
  }


  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <PageHeader title="New Laser Lot" description="Today's Laser Department Summary" />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Lots Created</p>
                        <p className="text-4xl font-bold">{todaysStats.createdLots}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Lots Returned</p>
                        <p className="text-4xl font-bold">{todaysStats.returnedLots}</p>
                    </div>
                </div>
                 {todaysStats.operatorSummary.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-center text-muted-foreground mb-2">Returned PCS by Operator</h4>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                            {todaysStats.operatorSummary.map(op => (
                                <span key={op.operator}><span className="font-semibold">{op.operator}:</span> {op.pcs}</span>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card className="max-w-4xl mx-auto glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Step 1: Lot Details
                    </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="kapanNumber" render={({ field }) => (
                          <FormItem><FormLabel>Kapan Number</FormLabel><FormControl><Input {...field} disabled={formSubmitted} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="lotNumber" render={({ field }) => (
                          <FormItem><FormLabel>Lot Number</FormLabel><FormControl><Input {...field} disabled={formSubmitted} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="tensionType" render={({ field }) => (
                          <FormItem><FormLabel>Tension Type</FormLabel>
                              <Select onValueChange={handleTensionChange} value={field.value} disabled={formSubmitted}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select tension type" /></SelectTrigger></FormControl>
                                  <SelectContent>{laserMappings.map(map => (<SelectItem key={map.id} value={map.tensionType}>{map.tensionType}</SelectItem>))}</SelectContent>
                              </Select><FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="machine" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Machine Name</FormLabel>
                              <FormControl>
                                <Input 
                                    {...field} 
                                    readOnly 
                                    disabled 
                                    className={cn(
                                        "font-bold",
                                        machineName?.toUpperCase() === 'GREEN' && 'animate-green-glow',
                                        machineName?.toUpperCase() === 'DHARMAJ' && 'animate-dharmaj-glow'
                                    )}
                                />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="packetCount" render={({ field }) => (
                          <FormItem><FormLabel>Packet Count</FormLabel><FormControl><Input type="number" {...field} disabled={formSubmitted} /></FormControl><FormMessage /></FormItem>
                      )} />
                  </div>
                   {!formSubmitted && (
                        <Button type="submit">Next: Scan Packets</Button>
                    )}
                  </form>
              </Form>
              </CardContent>
          </Card>

          <Card className="max-w-4xl mx-auto glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Laser Lot Series
                    </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <LotSeriesViewer 
                      series={lotSeries}
                      completedLots={completedLots}
                      currentLot={parseInt(currentLotNumberStr, 10)}
                      nextLot={nextLot}
                      lastCompletedLot={lastCompletedLot}
                      onLotClick={handleLotClick}
                  />
              </CardContent>
          </Card>

          {formSubmitted && currentLotDetails && (
              <Card className="max-w-4xl mx-auto glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                           Step 2: Scan Packets
                        </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <form onSubmit={handleBarcodeScan} className="flex gap-2 mb-4">
                          <Input 
                              ref={barcodeInputRef}
                              placeholder="Scan barcode..."
                              value={barcode}
                              onChange={e => setBarcode(e.target.value)}
                              disabled={scannedPackets.length >= currentPacketCount && currentPacketCount > 0}
                          />
                          <Button type="submit" disabled={!barcode || (scannedPackets.length >= currentPacketCount && currentPacketCount > 0)}>
                              <Barcode className="mr-2 h-4 w-4" /> Add
                          </Button>
                      </form>

                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                         {Array.from({ length: currentLotDetails.packetCount }).map((_, index) => {
                              const packet = scannedPackets[index];
                              return (
                                  <Tooltip key={index}>
                                      <TooltipTrigger asChild>
                                          <div className={cn(
                                              "relative h-12 flex items-center justify-center rounded-md border text-sm font-mono overflow-hidden",
                                              packet ? 'bg-green-100 dark:bg-green-900/30 border-green-500/50 text-green-700' : 'bg-muted/50'
                                          )}>
                                              {!packet && (index + 1)}
                                              {packet && (
                                                <>
                                                  <span className="absolute bottom-0.5 left-1 text-xs font-bold text-green-700/70 animate-move-br">{index + 1}</span>
                                                  <span className="absolute top-0.5 right-1 text-xs font-semibold text-green-800/80 animate-move-tr">
                                                      {`${packet.packetNumber}${packet.suffix ? `-${packet.suffix}` : ''}`}
                                                  </span>
                                                </>
                                              )}
                                          </div>
                                      </TooltipTrigger>
                                       {packet && (
                                        <TooltipContent>
                                            <div className="flex flex-col gap-2 p-1">
                                                <p className="font-mono">{packet.fullBarcode}</p>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeletePacket(packet.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Scan
                                                </Button>
                                            </div>
                                        </TooltipContent>
                                       )}
                                  </Tooltip>
                              );
                          })}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                          <p className="text-sm text-muted-foreground font-semibold">
                              Scanned: {scannedPackets.length} / {currentLotDetails.packetCount}
                          </p>
                           <Button onClick={createFinalLot} disabled={scannedPackets.length !== currentLotDetails.packetCount}>
                                <PackagePlus className="mr-2 h-4 w-4" />
                                Create Laser Lot
                                {countdown !== null && (
                                    <span className="flex items-center ml-2 bg-primary/20 text-primary-foreground/80 rounded-full px-2 py-0.5 text-xs">
                                        <Timer className="mr-1 h-3 w-3 animate-spin"/>
                                        {countdown}
                                    </span>
                                )}
                            </Button>
                      </div>
                  </CardContent>
              </Card>
          )}
        </div>
        
        <div className="flex justify-center items-center mt-8">
            <LargeDiamondIcon className="w-48 h-48 opacity-20 animate-spin-y-slow drop-shadow-2xl" />
       </div>

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
      <LotDetailPopup lot={viewingLot} isOpen={!!viewingLot} onOpenChange={(open) => !open && setViewingLot(null)} />
    </TooltipProvider>
  );
}

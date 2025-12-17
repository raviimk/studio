'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { isToday, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY, SARIN_MAPPINGS_KEY, LASER_LOTS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator, SarinMapping, LaserLot, ScannedPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, CheckCircle, PackagePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  senderName: z.string(),
  operator: z.string().min(1, 'Please select an operator.'),
  machine: z.string(),
  kapanNumber: z.string().min(1, 'Kapan number is required.'),
  lotNumber: z.string().min(1, 'Lot number is required.'),
  sarinMainPackets: z.array(z.any()).optional(),
  mainPacketNumber: z.coerce.number().min(1, "Main Laser packets are required."),
  packetCount: z.coerce.number().min(0, 'Packet count must be a positive number.'),
  hasJiram: z.boolean().default(false),
  jiramCount: z.coerce.number().optional(),
}).refine(data => !data.hasJiram || (data.jiramCount && data.jiramCount >= 0), {
  message: "Jiram packet count is required if Jiram is checked.",
  path: ["jiramCount"],
});

const LargeDiamondIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>diamond</title>
        <path d="M2.103 12.052l13.398 16.629-5.373-16.629h-8.025zM11.584 12.052l4.745 16.663 4.083-16.663h-8.828zM17.051 28.681l12.898-16.629h-7.963l-4.935 16.629zM29.979 10.964l-3.867-6.612-3.869 6.612h7.736zM24.896 3.973h-7.736l3.867 6.839 3.869-6.839zM19.838 10.964l-3.867-6.612-3.868 6.612h7.735zM14.839 3.973h-7.735l3.868 6.839 3.867-6.839zM5.889 4.352l-3.867 6.612h7.735l-3.868-6.612z"></path>
    </svg>
);


export default function SarinPacketEntryPage() {
  const { toast } = useToast();
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [sarinMappings] = useLocalStorage<SarinMapping[]>(SARIN_MAPPINGS_KEY, []);
  const [laserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);

  const [laserLotLoading, setLaserLotLoading] = useState(false);
  const [foundLaserLot, setFoundLaserLot] = useState(false);
  const [initialPacketCount, setInitialPacketCount] = useState(0);
  
  // Refs for Enter key navigation
  const senderRef = useRef<HTMLInputElement>(null);
  const operatorRef = useRef<HTMLButtonElement>(null);
  const kapanRef = useRef<HTMLInputElement>(null);
  const lotRef = useRef<HTMLInputElement>(null);
  const packetCountRef = useRef<HTMLInputElement>(null);
  const jiramCountRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: 'Default Sender',
      operator: '',
      machine: '',
      kapanNumber: '',
      lotNumber: '',
      sarinMainPackets: [],
      mainPacketNumber: 0,
      packetCount: 0,
      hasJiram: false,
      jiramCount: 0,
    },
  });
  
  const { control, watch, setValue, getValues } = form;
  const watchKapan = watch('kapanNumber');
  const watchLot = watch('lotNumber');
  const selectedOperatorName = watch('operator');
  const hasJiram = watch('hasJiram');
  const jiramCount = watch('jiramCount');

  const todaysStats = useMemo(() => {
    if (!sarinPackets) return { createdLots: 0, returnedLots: 0, operatorSummary: [] };
    
    let createdLots = 0;
    let returnedLots = 0;
    const operatorSummary: Record<string, { operator: string, pcs: number }> = {};

    sarinPackets.forEach(lot => {
        if (isToday(parseISO(lot.date))) {
            createdLots++;
        }
        if (lot.isReturned && lot.returnDate && isToday(parseISO(lot.returnDate))) {
            returnedLots++;
            if (lot.returnedBy) {
                 if (!operatorSummary[lot.returnedBy]) {
                    operatorSummary[lot.returnedBy] = { operator: lot.returnedBy, pcs: 0 };
                }
                operatorSummary[lot.returnedBy].pcs += lot.packetCount || 0;
            }
        }
    });
    
    return { 
        createdLots, 
        returnedLots,
        operatorSummary: Object.values(operatorSummary).sort((a,b) => b.pcs - a.pcs)
    };
  }, [sarinPackets]);

  useEffect(() => {
    if (selectedOperatorName) {
      const operator = sarinOperators.find(op => op.name === selectedOperatorName);
      if (operator) {
        const mapping = sarinMappings.find(m => m.operatorId === operator.id);
        setValue('machine', mapping ? mapping.machine : 'N/A');
        setTimeout(() => kapanRef.current?.focus(), 0);
      }
    } else {
        setValue('machine', '');
    }
  }, [selectedOperatorName, sarinOperators, sarinMappings, setValue]);

  useEffect(() => {
    if (watchKapan && watchLot) {
      setLaserLotLoading(true);
      setFoundLaserLot(false);
      const found = laserLots.find(l => l.kapanNumber === watchKapan && l.lotNumber === watchLot && l.isReturned);
      
      setTimeout(() => { // simulate loading
        if (found) {
            setFoundLaserLot(true);
            setValue('sarinMainPackets', found.scannedPackets || []);
            setValue('mainPacketNumber', found.scannedPackets?.length || 0);
            const subPackets = found.subPacketCount || 0;
            setValue('packetCount', subPackets);
            setInitialPacketCount(subPackets); // Store initial value
            setTimeout(() => packetCountRef.current?.focus(), 100);
        } else {
            setFoundLaserLot(false);
            setValue('sarinMainPackets', []);
            setValue('mainPacketNumber', 0);
            setValue('packetCount', 0);
            setInitialPacketCount(0);
        }
        setLaserLotLoading(false);
      }, 500);

    } else {
        setFoundLaserLot(false);
        setValue('sarinMainPackets', []);
        setValue('mainPacketNumber', 0);
        setValue('packetCount', 0);
        setInitialPacketCount(0);
    }
  }, [watchKapan, watchLot, laserLots, setValue]);
  
  useEffect(() => {
    if (hasJiram) {
        const jiramVal = jiramCount || 0;
        const newPacketCount = initialPacketCount - jiramVal;
        setValue('packetCount', newPacketCount >= 0 ? newPacketCount : 0);
        setTimeout(() => jiramCountRef.current?.focus(), 0);
    } else {
        setValue('packetCount', initialPacketCount);
    }
  }, [hasJiram, jiramCount, initialPacketCount, setValue]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const existingEntry = sarinPackets.find(
        p => p.kapanNumber === values.kapanNumber && p.lotNumber === values.lotNumber
    );
    if (existingEntry) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Lot Number',
            description: `Lot Number ${values.lotNumber} already exists for Kapan ${values.kapanNumber}. Please do not reuse lot numbers in the same kapan.`,
        });
        return;
    }
      
    const newPacket: SarinPacket = {
      id: uuidv4(),
      ...values,
      mainPacketNumber: values.mainPacketNumber,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      isReturned: false,
    };
    setSarinPackets([...sarinPackets, newPacket]);
    toast({ title: 'Success', description: 'New Sarin packet entry created.' });
    form.reset({
        ...form.getValues(),
        kapanNumber: '',
        lotNumber: '',
        sarinMainPackets: [],
        mainPacketNumber: 0,
        packetCount: 0,
        hasJiram: false,
        jiramCount: 0,
    });
    setFoundLaserLot(false);
    setInitialPacketCount(0);
    kapanRef.current?.focus();
  }
  
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldRef: React.RefObject<HTMLElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        nextFieldRef.current?.focus();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Sarin Packet Entry" description="Create a new entry for Sarin packets." />
      <div className="grid lg:grid-cols-[1fr,300px] gap-8 items-start">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span>
                                Packet Details
                            </span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={control} name="senderName" render={({ field }) => (
                        <FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field} ref={senderRef} onKeyDown={(e) => handleKeyDown(e, operatorRef)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="operator" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Operator Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger ref={operatorRef}><SelectValue placeholder="Select an operator" /></SelectTrigger></FormControl>
                            <SelectContent>{sarinOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )} />
                        <FormField control={control} name="machine" render={({ field }) => (
                        <FormItem><FormLabel>Machine Number</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="kapanNumber" render={({ field }) => (
                        <FormItem><FormLabel>Kapan Number</FormLabel><FormControl><Input {...field} ref={kapanRef} onKeyDown={(e) => handleKeyDown(e, lotRef)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="lotNumber" render={({ field }) => (
                        <FormItem><FormLabel>Lot Number</FormLabel><FormControl><Input {...field} ref={lotRef} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="mainPacketNumber" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Main Packets from Laser</FormLabel>
                                <FormControl>
                                <div className="relative">
                                    <Input type="number" {...field} readOnly disabled />
                                    {laserLotLoading && <Loader2 className="animate-spin h-4 w-4 absolute right-2 top-2.5 text-muted-foreground" />}
                                </div>
                                </FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={control} name="packetCount" render={({ field }) => (
                        <FormItem><FormLabel>Packet Count (Sub-Packets)</FormLabel><FormControl><Input type="number" {...field} ref={packetCountRef} onKeyDown={(e) => handleKeyDown(e, submitRef)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="space-y-2">
                        <FormField control={control} name="hasJiram" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>Jiram Check</FormLabel></div>
                            </FormItem>
                        )} />
                        {hasJiram && (
                            <FormField control={control} name="jiramCount" render={({ field }) => (
                            <FormItem><FormLabel>Jiram Packet Count</FormLabel><FormControl><Input type="number" {...field} ref={jiramCountRef} onKeyDown={(e) => handleKeyDown(e, submitRef)} /></FormControl><FormMessage /></FormItem>
                            )} />
                        )}
                        </div>
                    </div>
                        {watchKapan && watchLot && !laserLotLoading && (
                            <div className="mt-4">
                                {foundLaserLot ? (
                                    <Alert className="border-green-500 text-green-700 dark:text-green-300 relative overflow-hidden">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertTitle>Laser Lot Found & Verified!</AlertTitle>
                                        <AlertDescription>Packet counts have been automatically populated. You may now proceed.</AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert variant="destructive">
                                        <AlertTitle>Returned Laser Lot Not Found</AlertTitle>
                                        <AlertDescription>No matching **returned** Laser Lot found. You cannot create a Sarin entry without a valid parent Laser Lot.</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                        <button type="submit" disabled={!foundLaserLot} ref={submitRef} className="uiverse-button mt-6">
                            <div className="state state--default">
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24">
                                        <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
                                    </svg>
                                </span>
                                <p>
                                    <span style={{ '--i': 0 } as React.CSSProperties}>S</span>
                                    <span style={{ '--i': 1 } as React.CSSProperties}>e</span>
                                    <span style={{ '--i': 2 } as React.CSSProperties}>n</span>
                                    <span style={{ '--i': 3 } as React.CSSProperties}>d</span>
                                </p>
                            </div>
                            <div className="state state--sent">
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24">
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" fill="none" stroke="currentColor" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"></path>
                                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" fill="none" stroke="currentColor" d="M8 12L11 15L16 10"></path>
                                    </svg>
                                </span>
                                <p>
                                    <span style={{ '--i': 0 } as React.CSSProperties}>E</span>
                                    <span style={{ '--i': 1 } as React.CSSProperties}>n</span>
                                    <span style={{ '--i': 2 } as React.CSSProperties}>t</span>
                                    <span style={{ '--i': 3 } as React.CSSProperties}>r</span>
                                    <span style={{ '--i': 4 } as React.CSSProperties}>y</span>
                                </p>
                            </div>
                            <div className="outline"></div>
                        </button>
                    </form>
                </Form>
                </CardContent>
            </Card>

        </div>
        <div className="sticky top-8">
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-center">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Lots Created</p>
                            <p className="font-headline text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-pulse">{todaysStats.createdLots}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Lots Returned</p>
                            <p className="font-headline text-3xl font-bold text-green-600">{todaysStats.returnedLots}</p>
                        </div>
                    </div>
                        {todaysStats.operatorSummary.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-xs font-medium text-center text-muted-foreground mb-2">Returned PCS by Operator</h4>
                            <div className="space-y-1 text-xs">
                                {todaysStats.operatorSummary.map(op => (
                                    <div key={op.operator} className="flex justify-between">
                                        <span className="font-semibold">{op.operator}:</span> 
                                        <span>{op.pcs}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                </Card>
                <div className="flex justify-center items-center mt-8">
                    <LargeDiamondIcon className="w-48 h-48 opacity-20 animate-spin-y-slow drop-shadow-2xl" />
                </div>
        </div>
      </div>
    </div>
  );
}

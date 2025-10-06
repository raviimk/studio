
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

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
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g stroke="hsl(var(--primary) / 0.5)" strokeWidth="1">
            <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="hsl(var(--primary) / 0.05)" />
            <path d="M50 5 L50 95" />
            <path d="M5 50 L95 50" />
            <path d="M27.5 27.5 L72.5 72.5" />
            <path d="M27.5 72.5 L72.5 27.5" />
            <path d="M50 5 L27.5 27.5 L50 50 L72.5 27.5 Z" fill="hsl(var(--primary) / 0.1)" />
            <path d="M5 50 L27.5 72.5 L50 50 L27.5 27.5 Z" fill="hsl(var(--primary) / 0.1)" />
            <path d="M50 95 L72.5 72.5 L50 50 L27.5 72.5 Z" fill="hsl(var(--primary) / 0.1)" />
            <path d="M95 50 L72.5 27.5 L50 50 L72.5 72.5 Z" fill="hsl(var(--primary) / 0.1)" />
        </g>
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


  useEffect(() => {
    if (selectedOperatorName) {
      const operator = sarinOperators.find(op => op.name === selectedOperatorName);
      if (operator) {
        const mapping = sarinMappings.find(m => m.operatorId === operator.id);
        setValue('machine', mapping ? mapping.machine : 'N/A');
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
    form.setFocus('kapanNumber');
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Sarin Packet Entry" description="Create a new entry for Sarin packets." />
      <Card className="max-w-2xl mx-auto">
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
                <FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="operator" render={({ field }) => (
                <FormItem>
                    <FormLabel>Operator Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an operator" /></SelectTrigger></FormControl>
                    <SelectContent>{sarinOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={control} name="machine" render={({ field }) => (
                <FormItem><FormLabel>Machine Number</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="kapanNumber" render={({ field }) => (
                <FormItem><FormLabel>Kapan Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="lotNumber" render={({ field }) => (
                <FormItem><FormLabel>Lot Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                <FormItem><FormLabel>Packet Count (Sub-Packets)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <FormItem><FormLabel>Jiram Packet Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
              <button type="submit" disabled={!foundLaserLot} className="animated-create-button mt-6">
                <div className="svg-wrapper-1">
                  <div className="svg-wrapper">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                    >
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path
                        fill="currentColor"
                        d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <span>Send</span>
              </button>
            </form>
          </Form>
        </CardContent>
      </Card>

       <div className="flex justify-center items-center mt-8">
            <LargeDiamondIcon className="w-48 h-48 opacity-20 animate-spin-slow" />
       </div>
    </div>
  );
}

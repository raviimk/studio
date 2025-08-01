
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const formSchema = z.object({
  senderName: z.string(),
  operator: z.string().min(1, 'Please select an operator.'),
  machine: z.string(),
  kapanNumber: z.string().min(1, 'Kapan number is required.'),
  lotNumber: z.string().min(1, 'Lot number is required.'),
  sarinMainPackets: z.array(z.any()).min(1, "Main Laser packets are required."),
  packetCount: z.coerce.number().min(1, 'Packet count must be at least 1.'),
  hasJiram: z.boolean().default(false),
  jiramCount: z.coerce.number().optional(),
}).refine(data => !data.hasJiram || (data.jiramCount && data.jiramCount > 0), {
  message: "Jiram packet count is required if Jiram is checked.",
  path: ["jiramCount"],
});

export default function SarinPacketEntryPage() {
  const { toast } = useToast();
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [sarinMappings] = useLocalStorage<SarinMapping[]>(SARIN_MAPPINGS_KEY, []);
  const [laserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);

  const [laserLotLoading, setLaserLotLoading] = useState(false);
  const [foundLaserLot, setFoundLaserLot] = useState<LaserLot | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: 'Default Sender',
      operator: '',
      machine: '',
      kapanNumber: '',
      lotNumber: '',
      sarinMainPackets: [],
      packetCount: 0,
      hasJiram: false,
      jiramCount: 0,
    },
  });
  
  const { control, watch, setValue } = form;
  const watchKapan = watch('kapanNumber');
  const watchLot = watch('lotNumber');
  const selectedOperatorName = watch('operator');
  const hasJiram = watch('hasJiram');


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
      const found = laserLots.find(l => l.kapanNumber === watchKapan && l.lotNumber === watchLot);
      
      setTimeout(() => { // simulate loading
        if (found) {
            setFoundLaserLot(found);
            setValue('sarinMainPackets', found.scannedPackets || []);
        } else {
            setFoundLaserLot(null);
            setValue('sarinMainPackets', []);
        }
        setLaserLotLoading(false);
      }, 500);

    } else {
        setFoundLaserLot(null);
        setValue('sarinMainPackets', []);
    }
  }, [watchKapan, watchLot, laserLots, setValue]);


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
      mainPacketNumber: values.sarinMainPackets?.length || 0,
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
        packetCount: 0,
        hasJiram: false,
        jiramCount: 0,
    });
    setFoundLaserLot(null);
    form.setFocus('kapanNumber');
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Sarin Packet Entry" description="Create a new entry for Sarin packets." />
      <Card className="max-w-2xl mx-auto">
        <CardHeader><CardTitle>Packet Details</CardTitle></CardHeader>
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

                <div className="md:col-span-2">
                    <FormLabel>Main Laser Packets</FormLabel>
                     <FormField
                        control={control}
                        name="sarinMainPackets"
                        render={({ field }) => (
                            <FormItem>
                                {laserLotLoading ? (
                                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" />Searching for Laser Lot...</div>
                                ) : foundLaserLot ? (
                                    <Alert>
                                        <AlertTitle>Laser Lot Found!</AlertTitle>
                                        <AlertDescription>
                                            Found {foundLaserLot.scannedPackets?.length || 0} main packets. These will be linked to this Sarin entry.
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {foundLaserLot.scannedPackets?.map(p => <Badge key={p.id} variant="secondary">{p.fullBarcode}</Badge>)}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ) : watchKapan && watchLot ? (
                                    <Alert variant="destructive">
                                        <AlertTitle>Laser Lot Not Found</AlertTitle>
                                        <AlertDescription>No matching Laser Lot found for this Kapan/Lot combination. You cannot proceed.</AlertDescription>
                                    </Alert>
                                ): (
                                    <Alert variant="default">
                                        <AlertTitle>Enter Kapan and Lot Number</AlertTitle>
                                        <AlertDescription>Enter Kapan and Lot numbers above to automatically fetch and link main packets from the Laser module.</AlertDescription>
                                    </Alert>
                                )}
                                <FormMessage />
                           </FormItem>
                        )}
                        />
                </div>


                <FormField control={control} name="packetCount" render={({ field }) => (
                  <FormItem><FormLabel>Packet Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
              <Button type="submit" disabled={!foundLaserLot}>Create Entry</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

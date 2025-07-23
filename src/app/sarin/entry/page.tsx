
'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY, SARIN_MAPPINGS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator, SarinMapping } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  senderName: z.string(),
  operator: z.string().min(1, 'Please select an operator.'),
  machine: z.string(),
  kapanNumber: z.string().min(1, 'Kapan number is required.'),
  lotNumber: z.string().min(1, 'Lot number is required.'),
  mainPacketNumber: z.coerce.number().min(1, 'Main packet count is required.'),
  packetCount: z.coerce.number().min(1, 'Packet count must be at least 1.'),
  hasJiram: z.boolean().default(false),
  jiramCount: z.coerce.number().optional(),
}).refine(data => !data.hasJiram || (data.jiramCount && data.jiramCount > 0), {
  message: "Jiram packet count is required if Jiram is checked.",
  path: ["jiramCount"],
});

export default function SarinPacketEntryPage() {
  const { toast } = useToast();
  const [sarinPackets, setSarinPackets] = useSyncedStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useSyncedStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [sarinMappings] = useSyncedStorage<SarinMapping[]>(SARIN_MAPPINGS_KEY, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: 'Default Sender',
      operator: '',
      machine: '',
      kapanNumber: '',
      lotNumber: '',
      mainPacketNumber: 0,
      packetCount: 0,
      hasJiram: false,
      jiramCount: 0,
    },
  });

  const selectedOperatorName = form.watch('operator');
  const hasJiram = form.watch('hasJiram');

  useEffect(() => {
    if (selectedOperatorName) {
      const operator = sarinOperators.find(op => op.name === selectedOperatorName);
      if (operator) {
        const mapping = sarinMappings.find(m => m.operatorId === operator.id);
        form.setValue('machine', mapping ? mapping.machine : 'N/A');
      }
    } else {
        form.setValue('machine', '');
    }
  }, [selectedOperatorName, sarinOperators, sarinMappings, form]);

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
        mainPacketNumber: 0,
        packetCount: 0,
        hasJiram: false,
        jiramCount: 0,
    });
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
                <FormField control={form.control} name="senderName" render={({ field }) => (
                  <FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="operator" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select an operator" /></SelectTrigger></FormControl>
                      <SelectContent>{sarinOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="machine" render={({ field }) => (
                  <FormItem><FormLabel>Machine Number</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="kapanNumber" render={({ field }) => (
                  <FormItem><FormLabel>Kapan Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lotNumber" render={({ field }) => (
                  <FormItem><FormLabel>Lot Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mainPacketNumber" render={({ field }) => (
                  <FormItem><FormLabel>Main Packet Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="packetCount" render={({ field }) => (
                  <FormItem><FormLabel>Packet Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="space-y-2">
                  <FormField control={form.control} name="hasJiram" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none"><FormLabel>Jiram Check</FormLabel></div>
                    </FormItem>
                  )} />
                  {hasJiram && (
                    <FormField control={form.control} name="jiramCount" render={({ field }) => (
                      <FormItem><FormLabel>Jiram Packet Count</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}
                </div>
              </div>
              <Button type="submit">Create Entry</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

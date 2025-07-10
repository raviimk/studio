'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_MAPPINGS_KEY } from '@/lib/constants';
import { LaserLot, LaserMapping } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  lotNumber: z.string().min(1, 'Lot number is required'),
  kapanNumber: z.string().min(1, 'Kapan number is required'),
  tensionType: z.string().min(1, 'Tension type is required'),
  machine: z.string(),
  packetCount: z.coerce.number().min(1, 'Packet count must be at least 1'),
});

export default function NewLaserLotPage() {
  const { toast } = useToast();
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserMappings] = useLocalStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);

  const form = useForm<z.infer<typeof formSchema>>({
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newLot: LaserLot = {
      id: uuidv4(),
      ...values,
      entryDate: new Date().toISOString(),
      isReturned: false,
    };
    setLaserLots([...laserLots, newLot]);
    toast({ title: 'Success', description: 'New laser lot has been created.' });
    form.reset();
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="New Laser Lot" description="Create a new entry for a laser lot." />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Lot Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kapanNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kapan Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tensionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tension Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tension type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {laserMappings.map(map => (
                            <SelectItem key={map.id} value={map.tensionType}>{map.tensionType}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="machine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Name</FormLabel>
                      <FormControl><Input {...field} readOnly disabled /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packetCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packet Count</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit">Create Laser Lot</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

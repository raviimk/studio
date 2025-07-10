'use client';
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_MAPPINGS_KEY, LASER_OPERATORS_KEY, SARIN_MAPPINGS_KEY, SARIN_OPERATORS_KEY } from '@/lib/constants';
import { LaserMapping, LaserOperator, SarinMapping, SarinOperator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/PageHeader';

// Schemas
const sarinOperatorSchema = z.object({
  name: z.string().min(1, 'Operator name is required'),
  machine: z.string().min(1, 'Machine number is required'),
});

const laserOperatorSchema = z.object({
  name: z.string().min(1, 'Operator name is required'),
});

const laserMappingSchema = z.object({
  tensionType: z.string().min(1, 'Tension type is required'),
  machine: z.string().min(1, 'Machine name is required'),
});

export default function ControlPanelPage() {
  const { toast } = useToast();
  const [sarinOperators, setSarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [sarinMappings, setSarinMappings] = useLocalStorage<SarinMapping[]>(SARIN_MAPPINGS_KEY, []);
  const [laserOperators, setLaserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [laserMappings, setLaserMappings] = useLocalStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);

  const sarinForm = useForm<z.infer<typeof sarinOperatorSchema>>({
    resolver: zodResolver(sarinOperatorSchema),
    defaultValues: { name: '', machine: '' },
  });

  const laserOpForm = useForm<z.infer<typeof laserOperatorSchema>>({
    resolver: zodResolver(laserOperatorSchema),
    defaultValues: { name: '' },
  });

  const laserMapForm = useForm<z.infer<typeof laserMappingSchema>>({
    resolver: zodResolver(laserMappingSchema),
    defaultValues: { tensionType: '', machine: '' },
  });
  
  function handleAddSarinOperator(values: z.infer<typeof sarinOperatorSchema>) {
    const operatorId = uuidv4();
    const newOperator: SarinOperator = { id: operatorId, name: values.name };
    const newMapping: SarinMapping = { id: uuidv4(), operatorId: operatorId, operatorName: values.name, machine: values.machine };

    setSarinOperators([...sarinOperators, newOperator]);
    setSarinMappings([...sarinMappings, newMapping]);
    toast({ title: 'Success', description: 'Sarin operator and mapping added.' });
    sarinForm.reset();
  }
  
  function handleDeleteSarinOperator(id: string) {
    setSarinOperators(sarinOperators.filter(op => op.id !== id));
    setSarinMappings(sarinMappings.filter(map => map.operatorId !== id));
    toast({ title: 'Success', description: 'Sarin operator and mapping deleted.' });
  }

  function handleAddLaserOperator(values: z.infer<typeof laserOperatorSchema>) {
    const newOperator: LaserOperator = { id: uuidv4(), name: values.name };
    setLaserOperators([...laserOperators, newOperator]);
    toast({ title: 'Success', description: 'Laser operator added.' });
    laserOpForm.reset();
  }
  
  function handleDeleteLaserOperator(id: string) {
    setLaserOperators(laserOperators.filter(op => op.id !== id));
    toast({ title: 'Success', description: 'Laser operator deleted.' });
  }

  function handleAddLaserMapping(values: z.infer<typeof laserMappingSchema>) {
    const newMapping: LaserMapping = { id: uuidv4(), ...values };
    setLaserMappings([...laserMappings, newMapping]);
    toast({ title: 'Success', description: 'Laser tension mapping added.' });
    laserMapForm.reset();
  }

  function handleDeleteLaserMapping(id: string) {
    setLaserMappings(laserMappings.filter(map => map.id !== id));
    toast({ title: 'Success', description: 'Laser tension mapping deleted.' });
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Control Panel" description="Manage operators and machine mappings." />
      <Tabs defaultValue="sarin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sarin">Sarin</TabsTrigger>
          <TabsTrigger value="laser">Laser</TabsTrigger>
        </TabsList>
        <TabsContent value="sarin" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Add Sarin Operator & Machine</CardTitle></CardHeader>
            <CardContent>
              <Form {...sarinForm}>
                <form onSubmit={sarinForm.handleSubmit(handleAddSarinOperator)} className="space-y-4">
                  <FormField control={sarinForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Operator Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={sarinForm.control} name="machine" render={({ field }) => (
                    <FormItem><FormLabel>Assigned Machine</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit">Add Sarin Operator</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Manage Sarin Operators</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Machine</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {sarinMappings.map(map => (
                            <TableRow key={map.id}>
                                <TableCell>{map.operatorName}</TableCell>
                                <TableCell>{map.machine}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSarinOperator(map.operatorId)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="laser" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Add Laser Operator</CardTitle></CardHeader>
                    <CardContent>
                        <Form {...laserOpForm}>
                            <form onSubmit={laserOpForm.handleSubmit(handleAddLaserOperator)} className="space-y-4">
                                <FormField control={laserOpForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Operator Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit">Add Laser Operator</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Manage Laser Operators</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {laserOperators.map(op => (
                                    <TableRow key={op.id}>
                                        <TableCell>{op.name}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteLaserOperator(op.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Add Laser Tension Mapping</CardTitle></CardHeader>
                    <CardContent>
                        <Form {...laserMapForm}>
                            <form onSubmit={laserMapForm.handleSubmit(handleAddLaserMapping)} className="space-y-4">
                                <FormField control={laserMapForm.control} name="tensionType" render={({ field }) => (
                                    <FormItem><FormLabel>Tension Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={laserMapForm.control} name="machine" render={({ field }) => (
                                    <FormItem><FormLabel>Machine Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit">Add Mapping</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Manage Laser Mappings</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Tension</TableHead><TableHead>Machine</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {laserMappings.map(map => (
                                    <TableRow key={map.id}>
                                        <TableCell>{map.tensionType}</TableCell>
                                        <TableCell>{map.machine}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteLaserMapping(map.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

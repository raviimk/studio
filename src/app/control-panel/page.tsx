
'use client';
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  ALL_APP_KEYS,
  LASER_MAPPINGS_KEY, LASER_OPERATORS_KEY, SARIN_MAPPINGS_KEY, SARIN_OPERATORS_KEY,
  FOURP_OPERATORS_KEY, FOURP_TECHING_OPERATORS_KEY, PRICE_MASTER_KEY, UHDHA_SETTINGS_KEY,
  FOURP_DEPARTMENT_SETTINGS_KEY, BOX_SORTING_RANGES_KEY
} from '@/lib/constants';
import { LaserMapping, LaserOperator, SarinMapping, SarinOperator, FourPOperator, FourPTechingOperator, PriceMaster, UdhdaSettings, FourPDepartmentSettings, BoxSortingRange } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/PageHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

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

const fourPOperatorSchema = z.object({
  name: z.string().min(1, 'Operator name is required'),
});

const fourPTechingOperatorSchema = z.object({
  name: z.string().min(1, 'Operator name is required'),
});

const priceMasterSchema = z.object({
  fourP: z.coerce.number().min(0, 'Rate must be positive'),
  fourPTeching: z.coerce.number().min(0, 'Rate must be positive'),
});

const fourPDepartmentSettingsSchema = z.object({
    caratThreshold: z.coerce.number().min(0, 'Threshold must be positive'),
    aboveThresholdDeptName: z.string().min(1, 'Department name is required'),
    belowThresholdDeptName: z.string().min(1, 'Department name is required'),
});

const udhdaSettingsSchema = z.object({
    returnTimeLimitMinutes: z.coerce.number().min(1, 'Time limit must be at least 1 minute'),
});

const boxSortingRangeSchema = z.object({
    from: z.coerce.number(),
    to: z.coerce.number(),
    label: z.string().min(1, 'Box label is required'),
}).refine(data => data.to > data.from, {
    message: 'To must be greater than From.',
    path: ['to'],
});


export default function ControlPanelPage() {
  const { toast } = useToast();
  const [sarinOperators, setSarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [sarinMappings, setSarinMappings] = useLocalStorage<SarinMapping[]>(SARIN_MAPPINGS_KEY, []);
  const [laserOperators, setLaserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [laserMappings, setLaserMappings] = useLocalStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);
  const [fourPOperators, setFourPOperators] = useLocalStorage<FourPOperator[]>(FOURP_OPERATORS_KEY, []);
  const [fourPTechingOperators, setFourPTechingOperators] = useLocalStorage<FourPTechingOperator[]>(FOURP_TECHING_OPERATORS_KEY, []);
  const [priceMaster, setPriceMaster] = useLocalStorage<PriceMaster>(PRICE_MASTER_KEY, { fourP: 0, fourPTeching: 0 });
  const [udhdhaSettings, setUdhdhaSettings] = useLocalStorage<UdhdaSettings>(UHDHA_SETTINGS_KEY, { returnTimeLimitMinutes: 60 });
  const [fourPDeptSettings, setFourPDeptSettings] = useLocalStorage<FourPDepartmentSettings>(FOURP_DEPARTMENT_SETTINGS_KEY, { caratThreshold: 0.009, aboveThresholdDeptName: 'Big Dept', belowThresholdDeptName: 'Small Dept' });
  const [boxSortingRanges, setBoxSortingRanges] = useLocalStorage<BoxSortingRange[]>(BOX_SORTING_RANGES_KEY, []);

  const sarinForm = useForm<z.infer<typeof sarinOperatorSchema>>({ resolver: zodResolver(sarinOperatorSchema), defaultValues: { name: '', machine: '' } });
  const laserOpForm = useForm<z.infer<typeof laserOperatorSchema>>({ resolver: zodResolver(laserOperatorSchema), defaultValues: { name: '' } });
  const laserMapForm = useForm<z.infer<typeof laserMappingSchema>>({ resolver: zodResolver(laserMappingSchema), defaultValues: { tensionType: '', machine: '' } });
  const fourPForm = useForm<z.infer<typeof fourPOperatorSchema>>({ resolver: zodResolver(fourPOperatorSchema), defaultValues: { name: '' } });
  const fourPTechingForm = useForm<z.infer<typeof fourPTechingOperatorSchema>>({ resolver: zodResolver(fourPTechingOperatorSchema), defaultValues: { name: '' } });
  const priceMasterForm = useForm<z.infer<typeof priceMasterSchema>>({ resolver: zodResolver(priceMasterSchema), values: priceMaster });
  const fourPDeptSettingsForm = useForm<z.infer<typeof fourPDepartmentSettingsSchema>>({ resolver: zodResolver(fourPDepartmentSettingsSchema), values: fourPDeptSettings });
  const udhdhaSettingsForm = useForm<z.infer<typeof udhdaSettingsSchema>>({ resolver: zodResolver(udhdaSettingsSchema), values: udhdhaSettings });
  const boxSortingForm = useForm<z.infer<typeof boxSortingRangeSchema>>({ resolver: zodResolver(boxSortingRangeSchema), defaultValues: { from: 0, to: 0, label: '' } });

  function handleAddSarinOperator(values: z.infer<typeof sarinOperatorSchema>) {
    const operatorId = uuidv4();
    setSarinOperators([...sarinOperators, { id: operatorId, name: values.name }]);
    setSarinMappings([...sarinMappings, { id: uuidv4(), operatorId: operatorId, operatorName: values.name, machine: values.machine }]);
    toast({ title: 'Success', description: 'Sarin operator and mapping added.' });
    sarinForm.reset();
  }
  
  function handleDeleteSarinOperator(id: string) {
    setSarinOperators(sarinOperators.filter(op => op.id !== id));
    setSarinMappings(sarinMappings.filter(map => map.operatorId !== id));
    toast({ title: 'Success', description: 'Sarin operator and mapping deleted.' });
  }

  function handleAddLaserOperator(values: z.infer<typeof laserOperatorSchema>) {
    setLaserOperators([...laserOperators, { id: uuidv4(), name: values.name }]);
    toast({ title: 'Success', description: 'Laser operator added.' });
    laserOpForm.reset();
  }
  
  function handleDeleteLaserOperator(id: string) {
    setLaserOperators(laserOperators.filter(op => op.id !== id));
    toast({ title: 'Success', description: 'Laser operator deleted.' });
  }

  function handleAddLaserMapping(values: z.infer<typeof laserMappingSchema>) {
    setLaserMappings([...laserMappings, { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: 'Laser tension mapping added.' });
    laserMapForm.reset();
  }

  function handleDeleteLaserMapping(id: string) {
    setLaserMappings(laserMappings.filter(map => map.id !== id));
    toast({ title: 'Success', description: 'Laser tension mapping deleted.' });
  }

  function handleAddFourPOperator(values: z.infer<typeof fourPOperatorSchema>) {
    setFourPOperators([...fourPOperators, { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: '4P operator added.' });
    fourPForm.reset();
  }

  function handleDeleteFourPOperator(id: string) {
    setFourPOperators(fourPOperators.filter(op => op.id !== id));
    toast({ title: 'Success', description: '4P operator deleted.' });
  }

  function handleAddFourPTechingOperator(values: z.infer<typeof fourPTechingOperatorSchema>) {
    setFourPTechingOperators([...fourPTechingOperators, { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: '4P Teching operator added.' });
    fourPTechingForm.reset();
  }

  function handleDeleteFourPTechingOperator(id: string) {
    setFourPTechingOperators(fourPTechingOperators.filter(op => op.id !== id));
    toast({ title: 'Success', description: '4P Teching operator deleted.' });
  }

  function handleUpdatePriceMaster(values: z.infer<typeof priceMasterSchema>) {
    setPriceMaster(values);
    toast({ title: 'Success', description: 'Price master updated.' });
  }
  
  function handleUpdateFourPDeptSettings(values: z.infer<typeof fourPDepartmentSettingsSchema>) {
    setFourPDeptSettings(values);
    toast({ title: 'Success', description: '4P department settings updated.' });
  }

  function handleUpdateUdhdhaSettings(values: z.infer<typeof udhdaSettingsSchema>) {
    setUdhdhaSettings(values);
    toast({ title: 'Success', description: 'Udhda settings updated.' });
  }

  function handleAddBoxSortingRange(values: z.infer<typeof boxSortingRangeSchema>) {
    setBoxSortingRanges([...boxSortingRanges, { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: 'Box sorting range added.' });
    boxSortingForm.reset();
  }

  function handleDeleteBoxSortingRange(id: string) {
    setBoxSortingRanges(boxSortingRanges.filter(range => range.id !== id));
    toast({ title: 'Success', description: 'Box sorting range deleted.' });
  }

  const handleBackup = () => {
    try {
      const backupData: { [key: string]: any } = {};
      ALL_APP_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          backupData[key] = JSON.parse(data);
        }
      });
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Backup Successful', description: 'All application data has been saved.' });
    } catch (error) {
      console.error('Backup failed:', error);
      toast({ variant: 'destructive', title: 'Backup Failed', description: 'Could not create the backup file.' });
    }
  };
  
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Invalid file content');
        }
        
        const backupData = JSON.parse(text);

        // Simple validation: check if at least one known key exists
        const hasKnownKey = ALL_APP_KEYS.some(key => key in backupData);
        if (!hasKnownKey) {
            throw new Error("File does not appear to be a valid backup.");
        }

        // Clear existing data from local storage
        localStorage.clear();

        // Restore all data from the backup file
        Object.keys(backupData).forEach(key => {
            // We write all keys from the backup, not just the ones in ALL_APP_KEYS,
            // to ensure future-proofing if new keys are added and old backups are used.
            localStorage.setItem(key, JSON.stringify(backupData[key]));
        });

        toast({ title: 'Restore Successful', description: 'Data restored. The app will now reload.' });
        
        // Use a timeout to ensure the toast is visible before reloading
        setTimeout(() => {
            window.location.reload();
        }, 1500);

      } catch (error) {
        console.error('Restore failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'The selected file is not a valid backup.';
        toast({ variant: 'destructive', title: 'Restore Failed', description: errorMessage });
      } finally {
        // Reset the file input so the same file can be re-uploaded if needed
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Control Panel" description="Manage operators, machine mappings, and price rates." />
      <Tabs defaultValue="sarin" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
          <TabsTrigger value="sarin">Sarin</TabsTrigger>
          <TabsTrigger value="laser">Laser</TabsTrigger>
          <TabsTrigger value="4p">4P & 4P Teching</TabsTrigger>
          <TabsTrigger value="udhdha">Udhda</TabsTrigger>
          <TabsTrigger value="box-sorting">Box Sorting</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
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
        <TabsContent value="4p" className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>4P Department Sorting</CardTitle>
                    <CardDescription>Define rules for automatically sorting packets based on carat weight from hire barcodes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...fourPDeptSettingsForm}>
                        <form onSubmit={fourPDeptSettingsForm.handleSubmit(handleUpdateFourPDeptSettings)} className="space-y-4 max-w-lg">
                             <div className="grid md:grid-cols-3 gap-4">
                                <FormField control={fourPDeptSettingsForm.control} name="caratThreshold" render={({ field }) => (
                                    <FormItem><FormLabel>Carat Threshold</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={fourPDeptSettingsForm.control} name="belowThresholdDeptName" render={({ field }) => (
                                    <FormItem><FormLabel>&le; Threshold Dept Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={fourPDeptSettingsForm.control} name="aboveThresholdDeptName" render={({ field }) => (
                                    <FormItem><FormLabel>&gt; Threshold Dept Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                             </div>
                            <Button type="submit">Update Sorting Rules</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Price Master</CardTitle>
                    <CardDescription>Set the per-piece rates for 4P and 4P Teching work.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...priceMasterForm}>
                        <form onSubmit={priceMasterForm.handleSubmit(handleUpdatePriceMaster)} className="space-y-4 max-w-sm">
                             <FormField control={priceMasterForm.control} name="fourP" render={({ field }) => (
                                <FormItem><FormLabel>4P Rate per piece (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={priceMasterForm.control} name="fourPTeching" render={({ field }) => (
                                <FormItem><FormLabel>4P Teching Rate per piece (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit">Update Rates</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add 4P Operator</CardTitle></CardHeader>
                        <CardContent>
                            <Form {...fourPForm}>
                                <form onSubmit={fourPForm.handleSubmit(handleAddFourPOperator)} className="space-y-4">
                                    <FormField control={fourPForm.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Operator Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit">Add 4P Operator</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Manage 4P Operators</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {fourPOperators.map(op => (
                                        <TableRow key={op.id}>
                                            <TableCell>{op.name}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteFourPOperator(op.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add 4P Teching Operator</CardTitle></CardHeader>
                        <CardContent>
                            <Form {...fourPTechingForm}>
                                <form onSubmit={fourPTechingForm.handleSubmit(handleAddFourPTechingOperator)} className="space-y-4">
                                    <FormField control={fourPTechingForm.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Operator Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit">Add 4P Teching Operator</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Manage 4P Teching Operators</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {fourPTechingOperators.map(op => (
                                        <TableRow key={op.id}>
                                            <TableCell>{op.name}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteFourPTechingOperator(op.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="udhdha" className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Udhda Packet Settings</CardTitle>
                    <CardDescription>Configure settings for individual packet tracking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...udhdhaSettingsForm}>
                        <form onSubmit={udhdhaSettingsForm.handleSubmit(handleUpdateUdhdhaSettings)} className="space-y-4 max-w-sm">
                            <FormField control={udhdhaSettingsForm.control} name="returnTimeLimitMinutes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Return Time Limit (Minutes)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit">Update Settings</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="box-sorting" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Box Sorting Range</CardTitle>
              <CardDescription>Define Polish Weight ranges to automatically sort packets into boxes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...boxSortingForm}>
                <form onSubmit={boxSortingForm.handleSubmit(handleAddBoxSortingRange)} className="space-y-4 max-w-lg">
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField control={boxSortingForm.control} name="from" render={({ field }) => (
                        <FormItem><FormLabel>From (Polish Wt.)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={boxSortingForm.control} name="to" render={({ field }) => (
                        <FormItem><FormLabel>To (Polish Wt.)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={boxSortingForm.control} name="label" render={({ field }) => (
                        <FormItem><FormLabel>Box Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit">Add Range</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Manage Box Sorting Ranges</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Box Label</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {boxSortingRanges.sort((a, b) => a.from - b.from).map(range => (
                            <TableRow key={range.id}>
                                <TableCell>{range.from.toFixed(3)}</TableCell>
                                <TableCell>{range.to.toFixed(3)}</TableCell>
                                <TableCell>{range.label}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBoxSortingRange(range.id)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="backup" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Backup</CardTitle>
              <CardDescription>
                Download a single JSON file containing all your application data. 
                Store this file in a safe place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBackup}>Backup Now</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Restore from Backup</CardTitle>
              <CardDescription>
                Restore your application data from a previously saved backup file.
                Warning: This will overwrite all current data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Restore Backup</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Restoring from a backup will permanently
                      delete all current data in your browser and replace it with the
                      data from the backup file.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <label htmlFor="restore-file" className="cursor-pointer">
                        Proceed and Choose File
                        <input
                          id="restore-file"
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleRestore}
                        />
                      </label>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

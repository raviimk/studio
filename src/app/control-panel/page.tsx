
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Star, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  ALL_APP_KEYS,
  LASER_MAPPINGS_KEY, LASER_OPERATORS_KEY, SARIN_MAPPINGS_KEY, SARIN_OPERATORS_KEY,
  FOURP_OPERATORS_KEY, FOURP_TECHING_OPERATORS_KEY, PRICE_MASTER_KEY, UHDHA_SETTINGS_KEY,
  FOURP_DEPARTMENT_SETTINGS_KEY, BOX_SORTING_RANGES_KEY, AUTO_BACKUP_SETTINGS_KEY, RETURN_SCAN_SETTINGS_KEY,
  DIAMETER_SORTING_RANGES_KEY, FOURP_RATES_KEY, FOURP_TECHING_LOTS_KEY, SARIN_PACKETS_KEY,
  LASER_LOTS_KEY, REASSIGN_LOGS_KEY, UHDHA_PACKETS_KEY, SYSTEM_SETTINGS_KEY
} from '@/lib/constants';
import { LaserMapping, LaserOperator, SarinMapping, SarinOperator, FourPOperator, FourPTechingOperator, PriceMaster, UdhdaSettings, FourPDepartmentSettings, BoxSortingRange, AutoBackupSettings, ReturnScanSettings, BoxDiameterRange, FourPRate, FourPLot, SarinPacket, LaserLot, ReassignLog, UdhdaPacket, SystemSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/PageHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { format } from 'date-fns';
import { handleBackup } from '@/lib/backup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSystemState } from '@/hooks/useSystemState';
import { cn } from '@/lib/utils';


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
  fourPTeching: z.coerce.number().min(0, 'Rate must be positive'),
});

const fourPRateSchema = z.object({
    from: z.coerce.number(),
    to: z.coerce.number(),
    rate: z.coerce.number().min(0, 'Rate must be positive'),
}).refine(data => data.to > data.from, {
    message: 'To must be greater than From.',
    path: ['to'],
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

const diameterSortingRangeSchema = z.object({
    from: z.coerce.number(),
    to: z.coerce.number(),
    label: z.string().min(1, 'Box label is required'),
}).refine(data => data.to > data.from, {
    message: 'To must be greater than From.',
    path: ['to'],
});

const systemSettingsSchema = z.object({
  youtubeLink: z.string().url('Please enter a valid YouTube URL.'),
  videoStartTime: z.string().optional(),
  videoEndTime: z.string().optional(),
});


const PASSKEY = "raviix07";

type EditingData = {
    id: string;
    field1: string;
    field2: string;
    type: 'sarin' | 'laser';
};

export default function ControlPanelPage() {
  const { toast } = useToast();
  const [sarinOperators, setSarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [sarinMappings, setSarinMappings] = useLocalStorage<SarinMapping[]>(SARIN_MAPPINGS_KEY, []);
  const [laserOperators, setLaserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [laserMappings, setLaserMappings] = useLocalStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);
  const [fourPOperators, setFourPOperators] = useLocalStorage<FourPOperator[]>(FOURP_OPERATORS_KEY, []);
  const [fourPTechingOperators, setFourPTechingOperators] = useLocalStorage<FourPTechingOperator[]>(FOURP_TECHING_OPERATORS_KEY, []);
  const [priceMaster, setPriceMaster] = useLocalStorage<PriceMaster>(PRICE_MASTER_KEY, { fourPTeching: 0 });
  const [fourPRates, setFourPRates] = useLocalStorage<FourPRate[]>(FOURP_RATES_KEY, []);
  const [udhdhaSettings, setUdhdhaSettings] = useLocalStorage<UdhdaSettings>(UHDHA_SETTINGS_KEY, { returnTimeLimitMinutes: 60 });
  const [fourPDeptSettings, setFourPDeptSettings] = useLocalStorage<FourPDepartmentSettings>(FOURP_DEPARTMENT_SETTINGS_KEY, { caratThreshold: 0.009, aboveThresholdDeptName: 'Big Dept', belowThresholdDeptName: 'Small Dept' });
  const [boxSortingRanges, setBoxSortingRanges] = useLocalStorage<BoxSortingRange[]>(BOX_SORTING_RANGES_KEY, []);
  const [diameterSortingRanges, setDiameterSortingRanges] = useLocalStorage<BoxDiameterRange[]>(DIAMETER_SORTING_RANGES_KEY, []);
  const [autoBackupSettings, setAutoBackupSettings] = useLocalStorage<AutoBackupSettings>(AUTO_BACKUP_SETTINGS_KEY, { intervalHours: 0, officeEndTime: '18:30' });
  const [returnScanSettings, setReturnScanSettings] = useLocalStorage<ReturnScanSettings>(RETURN_SCAN_SETTINGS_KEY, { sarin: true, laser: true });
  const [systemSettings, setSystemSettings] = useLocalStorage<SystemSettings>(SYSTEM_SETTINGS_KEY, { youtubeLink: 'https://www.youtube.com/watch?v=8-lR3VWJzCg', videoStartTime: '09:00', videoEndTime: '18:30' });
  
  // Data for cascading edits
  const [fourPTechingLots, setFourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [reassignLogs, setReassignLogs] = useLocalStorage<ReassignLog[]>(REASSIGN_LOGS_KEY, []);
  const [udhdhaPackets, setUdhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for editing dialog
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<EditingData | null>(null);

  // Passkey state
  const { isDeleteDisabled, setDeleteDisabled } = useSystemState();
  const [isPasskeyDialogOpen, setPasskeyDialogOpen] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyAttempts, setPasskeyAttempts] = useState(3);

  const sarinForm = useForm<z.infer<typeof sarinOperatorSchema>>({ resolver: zodResolver(sarinOperatorSchema), defaultValues: { name: '', machine: '' } });
  const laserOpForm = useForm<z.infer<typeof laserOperatorSchema>>({ resolver: zodResolver(laserOperatorSchema), defaultValues: { name: '' } });
  const laserMapForm = useForm<z.infer<typeof laserMappingSchema>>({ resolver: zodResolver(laserMappingSchema), defaultValues: { tensionType: '', machine: '' } });
  const fourPForm = useForm<z.infer<typeof fourPOperatorSchema>>({ resolver: zodResolver(fourPOperatorSchema), defaultValues: { name: '' } });
  const fourPTechingForm = useForm<z.infer<typeof fourPTechingOperatorSchema>>({ resolver: zodResolver(fourPTechingOperatorSchema), defaultValues: { name: '' } });
  const priceMasterForm = useForm<z.infer<typeof priceMasterSchema>>({ resolver: zodResolver(priceMasterSchema), values: priceMaster || { fourPTeching: 0 } });
  const fourPRateForm = useForm<z.infer<typeof fourPRateSchema>>({ resolver: zodResolver(fourPRateSchema), defaultValues: { from: 0, to: 0, rate: 0 }});
  const fourPDeptSettingsForm = useForm<z.infer<typeof fourPDepartmentSettingsSchema>>({ resolver: zodResolver(fourPDepartmentSettingsSchema), values: fourPDeptSettings || { caratThreshold: 0.009, aboveThresholdDeptName: 'Big Dept', belowThresholdDeptName: 'Small Dept' } });
  const udhdhaSettingsForm = useForm<z.infer<typeof udhdaSettingsSchema>>({ resolver: zodResolver(udhdaSettingsSchema), values: udhdhaSettings || { returnTimeLimitMinutes: 60 } });
  const boxSortingForm = useForm<z.infer<typeof boxSortingRangeSchema>>({ resolver: zodResolver(boxSortingRangeSchema), defaultValues: { from: 0, to: 0, label: '' } });
  const diameterSortingForm = useForm<z.infer<typeof diameterSortingRangeSchema>>({ resolver: zodResolver(diameterSortingRangeSchema), defaultValues: { from: 0, to: 0, label: '' } });
  const systemSettingsForm = useForm<z.infer<typeof systemSettingsSchema>>({ resolver: zodResolver(systemSettingsSchema), values: systemSettings });

  function handleAddSarinOperator(values: z.infer<typeof sarinOperatorSchema>) {
    const operatorId = uuidv4();
    setSarinOperators([...(sarinOperators || []), { id: operatorId, name: values.name }]);
    setSarinMappings([...(sarinMappings || []), { id: uuidv4(), operatorId: operatorId, operatorName: values.name, machine: values.machine }]);
    toast({ title: 'Success', description: 'Sarin operator and mapping added.' });
    sarinForm.reset();
  }
  
  function handleDeleteSarinOperator(id: string) {
    setSarinOperators((sarinOperators || []).filter(op => op.id !== id));
    setSarinMappings((sarinMappings || []).filter(map => map.operatorId !== id));
    toast({ title: 'Success', description: 'Sarin operator and mapping deleted.' });
  }

  function handleAddLaserOperator(values: z.infer<typeof laserOperatorSchema>) {
    setLaserOperators([...(laserOperators || []), { id: uuidv4(), name: values.name }]);
    toast({ title: 'Success', description: 'Laser operator added.' });
    laserOpForm.reset();
  }
  
  function handleDeleteLaserOperator(id: string) {
    setLaserOperators((laserOperators || []).filter(op => op.id !== id));
    toast({ title: 'Success', description: 'Laser operator deleted.' });
  }

  function handleAddLaserMapping(values: z.infer<typeof laserMappingSchema>) {
    setLaserMappings([...(laserMappings || []), { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: 'Laser tension mapping added.' });
    laserMapForm.reset();
  }

  function handleDeleteLaserMapping(id: string) {
    setLaserMappings((laserMappings || []).filter(map => map.id !== id));
    toast({ title: 'Success', description: 'Laser tension mapping deleted.' });
  }

  function handleAddFourPOperator(values: z.infer<typeof fourPOperatorSchema>) {
    setFourPOperators([...(fourPOperators || []), { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: '4P operator added.' });
    fourPForm.reset();
  }

  function handleDeleteFourPOperator(id: string) {
    setFourPOperators((fourPOperators || []).filter(op => op.id !== id));
    toast({ title: 'Success', description: '4P operator deleted.' });
  }

  function handleAddFourPTechingOperator(values: z.infer<typeof fourPTechingOperatorSchema>) {
    setFourPTechingOperators([...(fourPTechingOperators || []), { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: '4P Teching operator added.' });
    fourPTechingForm.reset();
  }

  function handleDeleteFourPTechingOperator(id: string) {
    setFourPTechingOperators((fourPTechingOperators || []).filter(op => op.id !== id));
    toast({ title: 'Success', description: '4P Teching operator deleted.' });
  }

  function handleToggleDefaultTechingOperator(id: string) {
    setFourPTechingOperators(prev => 
      prev.map(op => ({
        ...op,
        isDefault: op.id === id ? !op.isDefault : false
      }))
    );
    toast({ title: 'Success', description: 'Default 4P Teching operator updated.' });
  }

  function handleUpdatePriceMaster(values: z.infer<typeof priceMasterSchema>) {
    setPriceMaster(prev => ({...prev, ...values}));
    toast({ title: 'Success', description: 'Price master updated.' });
  }

  function handleAddFourPRate(values: z.infer<typeof fourPRateSchema>) {
    setFourPRates([...(fourPRates || []), {id: uuidv4(), ...values}]);
    toast({ title: 'Success', description: '4P rate added.' });
    fourPRateForm.reset();
  }

  function handleDeleteFourPRate(id: string) {
    setFourPRates((fourPRates || []).filter(r => r.id !== id));
    toast({ title: 'Success', description: '4P rate deleted.'});
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
    setBoxSortingRanges([...(boxSortingRanges || []), { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: 'Box sorting range added.' });
    boxSortingForm.reset();
  }

  function handleDeleteBoxSortingRange(id: string) {
    setBoxSortingRanges((boxSortingRanges || []).filter(range => range.id !== id));
    toast({ title: 'Success', description: 'Box sorting range deleted.' });
  }
  
  function handleAddDiameterSortingRange(values: z.infer<typeof diameterSortingRangeSchema>) {
    setDiameterSortingRanges([...(diameterSortingRanges || []), { id: uuidv4(), ...values }]);
    toast({ title: 'Success', description: 'Diameter sorting range added.' });
    diameterSortingForm.reset();
  }

  function handleDeleteDiameterSortingRange(id: string) {
    setDiameterSortingRanges((diameterSortingRanges || []).filter(range => range.id !== id));
    toast({ title: 'Success', description: 'Diameter sorting range deleted.' });
  }

  function handleUpdateSystemSettings(values: z.infer<typeof systemSettingsSchema>) {
    setSystemSettings(prev => ({ ...prev, ...values }));
    toast({ title: 'Success', description: 'System settings updated.' });
  }

  const doBackup = () => {
    const success = handleBackup(`backup-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`);
    if (success) {
      toast({
        title: 'Backup Successful',
        description: 'All application data has been downloaded.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Backup Failed',
        description: 'Could not create the backup file. Check the console for errors.',
      });
    }
  };
  
  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File could not be read as text.');
        }
        const data = JSON.parse(text);
        
        let restoredCount = 0;
        for (const key of ALL_APP_KEYS) {
          if (data[key]) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            restoredCount++;
          }
        }
        
        toast({ title: 'Restore Successful', description: `Restored data for ${restoredCount} keys. The page will now reload.` });
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error) {
        console.error('Restore failed:', error);
        toast({ variant: 'destructive', title: 'Restore Failed', description: 'The selected file is not a valid backup file.' });
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };
  
  const handleAutoBackupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const hours = name === 'intervalHours' ? parseInt(value, 10) : autoBackupSettings.intervalHours;
    
    if (name === 'intervalHours' && (isNaN(hours) || hours < 0)) {
        return;
    }

    setAutoBackupSettings(prev => ({
        ...prev,
        [name]: name === 'intervalHours' ? hours : value,
        lastBackupTimestamp: name === 'intervalHours' && hours > 0 ? Date.now() : prev.lastBackupTimestamp,
    }));
    toast({ title: 'Settings Saved' });
  }

  const handleScanSettingChange = (department: 'sarin' | 'laser', checked: boolean) => {
      setReturnScanSettings(prev => ({
          ...prev,
          [department]: checked
      }));
      toast({ title: 'Settings Saved' });
  };

  const handleOpenPasskeyDialog = () => {
    setPasskeyDialogOpen(true);
    setPasskeyInput('');
  };

  const handlePasskeyCheck = () => {
    if (passkeyInput === PASSKEY) {
      toast({ title: 'Passkey Correct!', description: 'Deleting all data now...' });
      setPasskeyDialogOpen(false);
      // Perform deletion
      ALL_APP_KEYS.forEach(key => localStorage.removeItem(key));
      toast({ title: 'All data deleted.', description: 'The page will now reload.' });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const newAttempts = passkeyAttempts - 1;
      setPasskeyAttempts(newAttempts);
      if (newAttempts > 0) {
        toast({ variant: 'destructive', title: 'Incorrect Passkey', description: `You have ${newAttempts} attempts remaining.` });
      } else {
        toast({ variant: 'destructive', title: 'Too Many Attempts', description: 'Delete functionality has been disabled.' });
        setDeleteDisabled(true);
        setPasskeyDialogOpen(false);
      }
    }
  };

  const openEditDialog = (type: 'sarin' | 'laser', item: {id: string, field1: string, field2: string}) => {
    setEditingData({ ...item, type });
    setEditDialogOpen(true);
  };
  
  const cascadeNameUpdate = (oldName: string, newName: string) => {
    if (oldName === newName) return;

    // Sarin Packets
    setSarinPackets(prev => prev.map(p => {
        let updatedPacket = { ...p };
        if (p.operator === oldName) updatedPacket.operator = newName;
        if (p.returnedBy === oldName) updatedPacket.returnedBy = newName;
        return updatedPacket;
    }));
    // Laser Lots
    setLaserLots(prev => prev.map(l => {
        if (l.returnedBy === oldName) return { ...l, returnedBy: newName };
        return l;
    }));
    // 4P Teching Lots
    setFourPTechingLots(prev => prev.map(lot => {
        let updatedLot = { ...lot };
        if (lot.techingOperator === oldName) updatedLot.techingOperator = newName;
        if (lot.fourPOperator === oldName) updatedLot.fourPOperator = newName;
        if (lot.fourPData) {
            updatedLot.fourPData = lot.fourPData.map(d => d.operator === oldName ? {...d, operator: newName} : d);
        }
        return updatedLot;
    }));
    // Reassignment Logs
    setReassignLogs(prev => prev.map(log => {
        let updatedLog = { ...log };
        if (log.fromOperator === oldName) updatedLog.fromOperator = newName;
        if (log.toOperator === oldName) updatedLog.toOperator = newName;
        return updatedLog;
    }));
    // Udhda Packets
    setUdhdhaPackets(prev => prev.map(p => {
        if (p.operator === oldName) return { ...p, operator: newName };
        return p;
    }));

    toast({ title: 'Success', description: `Name updated to "${newName}" across all records.` });
  };


  const handleSaveEdit = () => {
    if (!editingData) return;

    const { id, field1: newName, field2: newMachine, type } = editingData;
    
    if (type === 'sarin') {
        const originalMapping = sarinMappings.find(m => m.id === id);
        if (!originalMapping) return;

        // Cascade name change if operator name was edited
        if (originalMapping.operatorName !== newName) {
            const operator = sarinOperators.find(o => o.id === originalMapping.operatorId);
            if (operator) {
                setSarinOperators(prev => prev.map(o => o.id === operator.id ? { ...o, name: newName } : o));
                cascadeNameUpdate(originalMapping.operatorName, newName);
            }
        }
        
        setSarinMappings(prev => prev.map(m => m.id === id ? { ...m, operatorName: newName, machine: newMachine } : m));

    } else if (type === 'laser') {
        if (editingData.field2 === '') { // This is a Laser Operator edit
            const originalOperator = laserOperators.find(o => o.id === id);
            if (originalOperator) {
                 cascadeNameUpdate(originalOperator.name, newName);
                 setLaserOperators(prev => prev.map(o => o.id === id ? { ...o, name: newName } : o));
            }
        } else { // This is a Laser Mapping edit
             setLaserMappings(prev => prev.map(m => m.id === id ? { ...m, tensionType: newName, machine: newMachine } : m));
        }
    }
    
    toast({ title: 'Success', description: 'Entry updated successfully.'});
    setEditDialogOpen(false);
  };


  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <PageHeader title="Control Panel" description="Manage operators, machine mappings, and price rates." />
        <Tabs defaultValue="sarin" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-7">
            <TabsTrigger value="sarin">Sarin</TabsTrigger>
            <TabsTrigger value="laser">Laser</TabsTrigger>
            <TabsTrigger value="4p">4P & 4P Teching</TabsTrigger>
            <TabsTrigger value="udhdha">Udhda</TabsTrigger>
            <TabsTrigger value="box-sorting">Box Sorting (Cent)</TabsTrigger>
            <TabsTrigger value="diameter-sorting">Box Sorting (Diameter)</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
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
                          {(sarinMappings || []).map(map => (
                              <TableRow key={map.id}>
                                  <TableCell>{map.operatorName}</TableCell>
                                  <TableCell>{map.machine}</TableCell>
                                  <TableCell className="flex gap-1">
                                      <Button variant="ghost" size="icon" onClick={() => openEditDialog('sarin', { id: map.id, field1: map.operatorName, field2: map.machine })}><Edit className="h-4 w-4" /></Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the operator <strong>{map.operatorName}</strong> and their machine mapping. This action cannot be undone.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteSarinOperator(map.operatorId)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
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
                                  {(laserOperators || []).map(op => (
                                      <TableRow key={op.id}>
                                          <TableCell>{op.name}</TableCell>
                                          <TableCell className="flex gap-1">
                                              <Button variant="ghost" size="icon" onClick={() => openEditDialog('laser', { id: op.id, field1: op.name, field2: ''})}><Edit className="h-4 w-4" /></Button>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the operator <strong>{op.name}</strong>. This action cannot be undone.</AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteLaserOperator(op.id)}>Delete</AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
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
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                              <TableHeader><TableRow><TableHead>Tension</TableHead><TableHead>Machine</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {(laserMappings || []).map(map => (
                                      <TableRow key={map.id}>
                                          <TableCell>{map.tensionType}</TableCell>
                                          <TableCell>{map.machine}</TableCell>
                                          <TableCell className="flex gap-1">
                                               <Button variant="ghost" size="icon" onClick={() => openEditDialog('laser', { id: map.id, field1: map.tensionType, field2: map.machine })}><Edit className="h-4 w-4" /></Button>
                                               <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the mapping for tension <strong>{map.tensionType}</strong>. This action cannot be undone.</AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteLaserMapping(map.id)}>Delete</AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                        </div>
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

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>4P Rate Management (Cent-wise)</CardTitle>
                            <CardDescription>Set the per-piece rates for 4P work based on carat weight.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...fourPRateForm}>
                                <form onSubmit={fourPRateForm.handleSubmit(handleAddFourPRate)} className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField control={fourPRateForm.control} name="from" render={({ field }) => (
                                            <FormItem><FormLabel>From (ct)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={fourPRateForm.control} name="to" render={({ field }) => (
                                            <FormItem><FormLabel>To (ct)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={fourPRateForm.control} name="rate" render={({ field }) => (
                                            <FormItem><FormLabel>Rate (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <Button type="submit">Add 4P Rate</Button>
                                </form>
                            </Form>
                            <Table className="mt-4">
                                <TableHeader><TableRow><TableHead>From (ct)</TableHead><TableHead>To (ct)</TableHead><TableHead>Rate (₹)</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {(fourPRates || []).sort((a,b) => a.from - b.from).map(r => (
                                        <TableRow key={r.id}>
                                            <TableCell>{r.from.toFixed(3)}</TableCell>
                                            <TableCell>{r.to.toFixed(3)}</TableCell>
                                            <TableCell>{r.rate.toFixed(2)}</TableCell>
                                            <TableCell>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete this rate range. This action cannot be undone.</AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteFourPRate(r.id)}>Delete</AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>4P Teching Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...priceMasterForm}>
                                <form onSubmit={priceMasterForm.handleSubmit(handleUpdatePriceMaster)} className="space-y-4 max-w-sm">
                                    <FormField control={priceMasterForm.control} name="fourPTeching" render={({ field }) => (
                                        <FormItem><FormLabel>4P Teching Rate per piece (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit">Update Teching Rate</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
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
                                    {(fourPOperators || []).map(op => (
                                        <TableRow key={op.id}>
                                            <TableCell>{op.name}</TableCell>
                                            <TableCell className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog('laser', { id: op.id, field1: op.name, field2: ''})}><Edit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                      <AlertDialogDescription>This will permanently delete the operator <strong>{op.name}</strong>. This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDeleteFourPOperator(op.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

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
                                    {(fourPTechingOperators || []).map(op => (
                                        <TableRow key={op.id}>
                                            <TableCell>{op.name}</TableCell>
                                            <TableCell className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog('laser', { id: op.id, field1: op.name, field2: ''})}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleToggleDefaultTechingOperator(op.id)}>
                                                    <Star className={cn("h-4 w-4", op.isDefault ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                                                </Button>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                      <AlertDialogDescription>This will permanently delete the operator <strong>{op.name}</strong>. This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDeleteFourPTechingOperator(op.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
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
                <CardTitle>Add Box Sorting Range (by Polish Weight)</CardTitle>
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
              <CardHeader><CardTitle>Manage Box Sorting Ranges (by Polish Weight)</CardTitle></CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader><TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Box Label</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {(boxSortingRanges || []).sort((a, b) => a.from - b.from).map(range => (
                              <TableRow key={range.id}>
                                  <TableCell>{(range.from ?? 0).toFixed(3)}</TableCell>
                                  <TableCell>{(range.to ?? 0).toFixed(3)}</TableCell>
                                  <TableCell>{range.label}</TableCell>
                                  <TableCell>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>This will permanently delete the range for box <strong>{range.label}</strong>. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteBoxSortingRange(range.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="diameter-sorting" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Diameter Sorting Range (by mm)</CardTitle>
                <CardDescription>Define diameter ranges (in mm) to automatically sort packets into boxes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...diameterSortingForm}>
                  <form onSubmit={diameterSortingForm.handleSubmit(handleAddDiameterSortingRange)} className="space-y-4 max-w-lg">
                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField control={diameterSortingForm.control} name="from" render={({ field }) => (
                          <FormItem><FormLabel>From (mm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={diameterSortingForm.control} name="to" render={({ field }) => (
                          <FormItem><FormLabel>To (mm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={diameterSortingForm.control} name="label" render={({ field }) => (
                          <FormItem><FormLabel>Box Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <Button type="submit">Add Range</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Manage Diameter Sorting Ranges</CardTitle></CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader><TableRow><TableHead>From (mm)</TableHead><TableHead>To (mm)</TableHead><TableHead>Box Label</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {(diameterSortingRanges || []).sort((a, b) => a.from - b.from).map(range => (
                              <TableRow key={range.id}>
                                  <TableCell>{(range.from ?? 0).toFixed(2)}</TableCell>
                                  <TableCell>{(range.to ?? 0).toFixed(2)}</TableCell>
                                  <TableCell>{range.label}</TableCell>
                                  <TableCell>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>This will permanently delete the range for box <strong>{range.label}</strong>. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteDiameterSortingRange(range.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="system" className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>YouTube Player Settings</CardTitle>
                    <CardDescription>
                        Update the video played in the sidebar and set its active time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...systemSettingsForm}>
                        <form onSubmit={systemSettingsForm.handleSubmit(handleUpdateSystemSettings)} className="space-y-4 max-w-lg">
                            <FormField control={systemSettingsForm.control} name="youtubeLink" render={({ field }) => (
                                <FormItem><FormLabel>YouTube Video Link</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField control={systemSettingsForm.control} name="videoStartTime" render={({ field }) => (
                                  <FormItem><FormLabel>Video Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                              <FormField control={systemSettingsForm.control} name="videoEndTime" render={({ field }) => (
                                  <FormItem><FormLabel>Video End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </div>
                            <Button type="submit">Update Video Settings</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>
                      Download all application data to a single JSON file for backup. You can restore from this file at any time.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                      <Button onClick={doBackup}>Backup All Data</Button>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          Restore From File...
                          <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
                      </Button>
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="mt-4" disabled={isDeleteDisabled}>
                            {isDeleteDisabled ? "Deletion Disabled" : "Delete All Data"}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete all data from this application.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleOpenPasskeyDialog}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                  <CardTitle>Return Scan Mode</CardTitle>
                  <CardDescription>
                    Enable or disable mandatory barcode scanning when returning lots for Sarin and Laser departments.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                      id="sarin-scan-mode"
                      checked={returnScanSettings.sarin}
                      onCheckedChange={(checked) => handleScanSettingChange('sarin', checked)}
                    />
                    <Label htmlFor="sarin-scan-mode">Sarin Return Scan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                      id="laser-scan-mode"
                      checked={returnScanSettings.laser}
                      onCheckedChange={(checked) => handleScanSettingChange('laser', checked)}
                    />
                    <Label htmlFor="laser-scan-mode">Laser Return Scan</Label>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                  <CardTitle>Auto-Backup Settings</CardTitle>
                  <CardDescription>
                      The app can automatically save a backup file for you.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 max-w-lg">
                      <div>
                          <Label htmlFor="backup-interval">Backup Interval (Hours)</Label>
                          <Select name="intervalHours" value={String(autoBackupSettings.intervalHours)} onValueChange={(value) => handleAutoBackupChange({ target: { name: 'intervalHours', value } } as any)}>
                              <SelectTrigger id="backup-interval"><SelectValue/></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="0">Disabled</SelectItem>
                                  <SelectItem value="1">Every 1 Hour</SelectItem>
                                  <SelectItem value="2">Every 2 Hours</SelectItem>
                                  <SelectItem value="4">Every 4 Hours</SelectItem>
                                  <SelectItem value="8">Every 8 Hours</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div>
                          <Label htmlFor="office-end-time">Office End Time</Label>
                          <Input
                              id="office-end-time"
                              type="time"
                              name="officeEndTime"
                              value={autoBackupSettings.officeEndTime}
                              onChange={handleAutoBackupChange}
                          />
                      </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Entry</DialogTitle>
                <DialogDescription>
                    Update the details for this entry.
                </DialogDescription>
            </DialogHeader>
            {editingData && (
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{editingData.type === 'sarin' ? 'Operator Name' : (editingData.field2 === '' ? 'Operator Name' : 'Tension Type')}</Label>
                        <Input
                            value={editingData.field1}
                            onChange={(e) => setEditingData({...editingData, field1: e.target.value})}
                        />
                    </div>
                    {editingData.field2 !== '' && (
                         <div className="space-y-2">
                            <Label>Machine Name</Label>
                            <Input
                                value={editingData.field2}
                                onChange={(e) => setEditingData({...editingData, field2: e.target.value})}
                            />
                        </div>
                    )}
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPasskeyDialogOpen} onOpenChange={setPasskeyDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enter Passkey to Confirm Deletion</DialogTitle>
                <DialogDescription>
                    This is a final confirmation. This action is irreversible. You have {passkeyAttempts} attempts remaining.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
                <Label htmlFor="passkey">Passkey</Label>
                <Input
                    id="passkey"
                    type="password"
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setPasskeyDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handlePasskeyCheck}>Confirm Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

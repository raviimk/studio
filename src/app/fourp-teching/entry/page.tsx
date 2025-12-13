
'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_TECHING_OPERATORS_KEY, PRICE_MASTER_KEY, FOURP_DEPARTMENT_SETTINGS_KEY, FOURP_RATES_KEY } from '@/lib/constants';
import { FourPLot, FourPTechingOperator, PriceMaster, FourPDepartmentSettings, FourPRate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, Trash2, Tag, Weight, Edit, Save, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, isToday, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type LotDetails = {
  kapan: string;
  lot: string;
};

type HireDetails = {
    carat: number;
    department: string;
}

// Function to find the correct rate
const findRate = (carat: number, rates: FourPRate[]): number => {
    const matchedRate = rates.find(r => carat >= r.from && carat <= r.to);
    return matchedRate ? matchedRate.rate : 0;
};


export default function FourPTechingEntryPage() {
  const { toast } = useToast();
  const [fourPTechingLots, setFourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [fourPTechingOperators] = useLocalStorage<FourPTechingOperator[]>(FOURP_TECHING_OPERATORS_KEY, []);
  const [priceMaster] = useLocalStorage<PriceMaster>(PRICE_MASTER_KEY, { fourPTeching: 0 });
  const [fourPRates] = useLocalStorage<FourPRate[]>(FOURP_RATES_KEY, []);
  const [deptSettings] = useLocalStorage<FourPDepartmentSettings>(FOURP_DEPARTMENT_SETTINGS_KEY, { caratThreshold: 0.009, aboveThresholdDeptName: 'Big Dept', belowThresholdDeptName: 'Small Dept' });


  const [lotBarcode, setLotBarcode] = useState('');
  const [hireBarcode, setHireBarcode] = useState('');
  const [lotDetails, setLotDetails] = useState<LotDetails | null>(null);
  const [hireDetails, setHireDetails] = useState<HireDetails | null>(null);
  
  const [techingOperator, setTechingOperator] = useState('');
  const [pcs, setPcs] = useState('');
  const [blocking, setBlocking] = useState('');

  const hireInputRef = useRef<HTMLInputElement>(null);
  const pcsInputRef = useRef<HTMLInputElement>(null);
  const blockingInputRef = useRef<HTMLInputElement>(null);

  // State for editing
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FourPLot>>({});
  
  // State for searching
  const [searchTerm, setSearchTerm] = useState('');
  
  const todaysLotCount = useMemo(() => {
    if (!fourPTechingLots) return 0;
    return fourPTechingLots.filter(lot => isToday(parseISO(lot.entryDate))).length;
  }, [fourPTechingLots]);


  useEffect(() => {
      // Auto-select default operator if one exists
      const defaultOperator = fourPTechingOperators.find(op => op.isDefault);
      if (defaultOperator) {
          setTechingOperator(defaultOperator.name);
      } else if (fourPTechingOperators.length === 1) {
          setTechingOperator(fourPTechingOperators[0].name);
      }
  }, [fourPTechingOperators]);

  const handleLotBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const match = lotBarcode.match(/^(\d+)-[A-Z]-(\d+)$/);
    if (!match) {
      toast({ variant: 'destructive', title: 'Invalid Lot Barcode', description: 'Expected format: Kapan-Bunch-Lot (e.g., 61-B-1057)' });
      return;
    }
    const [, kapan, lot] = match;

    const existingLot = fourPTechingLots.find(
      l => l.kapan === kapan && l.lot === lot
    );
    if (existingLot) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Lot Number',
        description: `This Lot Number already exists in Kapan No. ${kapan}. Please do not reuse the same Lot in the same Kapan, even if it was returned.`,
      });
      return;
    }

    setLotDetails({ kapan, lot });
    setTimeout(() => hireInputRef.current?.focus(), 100);
  };
  
  const handleHireBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const values = hireBarcode.split(',');
    if (values.length < 9) {
      toast({ variant: 'destructive', title: 'Invalid Hire Barcode', description: 'Could not find at least 9 comma-separated values.' });
      return;
    }
    
    const caratWeight = parseFloat(values[8]);
    if (isNaN(caratWeight)) {
        toast({ variant: 'destructive', title: 'Invalid Carat Weight', description: 'The 9th value in the hire barcode is not a valid number.' });
        return;
    }
    
    const department = caratWeight > deptSettings.caratThreshold ? deptSettings.aboveThresholdDeptName : deptSettings.belowThresholdDeptName;
    setHireDetails({ carat: caratWeight, department });
    toast({ title: 'Hire Scanned', description: `Carat: ${caratWeight}. Assigned to ${department}`});
    setPcs('25'); // Set default PCS value
    setTimeout(() => pcsInputRef.current?.focus(), 100);
  };
  
  const handleSaveLot = () => {
    if (!lotDetails || !hireDetails || !techingOperator || !pcs) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields: barcodes, operator, and PCS.' });
      return;
    }

    const numPcs = parseInt(pcs, 10);
    const numBlocking = parseInt(blocking || '0', 10);

    if (isNaN(numPcs) || numPcs <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid number for Total PCS.' });
        return;
    }
    if (isNaN(numBlocking) || numBlocking < 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Blocking PCS must be a positive number.' });
        return;
    }
    if (numBlocking > numPcs) {
        toast({ variant: 'destructive', title: 'Error', description: 'Blocking PCS cannot be more than Total PCS.' });
        return;
    }
    
    const finalPcs = numPcs - numBlocking;
    const techingAmount = finalPcs * priceMaster.fourPTeching;
    const fourPAmount = finalPcs * findRate(hireDetails.carat, fourPRates);

    const newLot: FourPLot = {
      id: uuidv4(),
      ...lotDetails,
      ...hireDetails,
      pcs: numPcs,
      blocking: numBlocking,
      finalPcs: finalPcs,
      techingOperator: techingOperator,
      techingAmount: techingAmount,
      fourPAmount: fourPAmount, // Pre-calculate 4P amount
      entryDate: new Date().toISOString(),
      isReturnedToFourP: false,
    };
    setFourPTechingLots([...fourPTechingLots, newLot]);
    toast({ title: 'Success', description: `Lot created. Total: ${numPcs}, Final: ${finalPcs}` });

    // Reset state
    setLotBarcode('');
    setHireBarcode('');
    setLotDetails(null);
    setHireDetails(null);
    setPcs('');
    setBlocking('');
    const defaultOperator = fourPTechingOperators.find(op => op.isDefault);
    if (!defaultOperator) {
        setTechingOperator('');
    }
  };

  const handlePcsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      blockingInputRef.current?.focus();
    }
  };

  const handleBlockingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveLot();
    }
  };

  const handleDeleteLot = (lotId: string) => {
    if (window.confirm('Are you sure you want to delete this lot entry? This action cannot be undone.')) {
      setFourPTechingLots(fourPTechingLots.filter(lot => lot.id !== lotId));
      toast({ title: 'Success', description: 'Lot entry deleted.' });
    }
  };

  const handleEditClick = (lot: FourPLot) => {
    setEditingLotId(lot.id);
    setEditFormData({
        pcs: lot.pcs,
        blocking: lot.blocking,
        department: lot.department,
        techingOperator: lot.techingOperator,
    });
  };

  const handleCancelEdit = () => {
    setEditingLotId(null);
    setEditFormData({});
  };

  const handleSaveEdit = (lotId: string) => {
    const originalLot = fourPTechingLots.find(lot => lot.id === lotId);
    if (!originalLot) return;

    const updatedLotData = { ...editFormData };
    const newPcs = updatedLotData.pcs || 0;
    const newBlocking = updatedLotData.blocking || 0;
    
    if (newBlocking > newPcs) {
      toast({ variant: 'destructive', title: 'Error', description: 'Blocking PCS cannot be more than Total PCS.' });
      return;
    }

    const newFinalPcs = newPcs - newBlocking;
    updatedLotData.finalPcs = newFinalPcs;
    updatedLotData.techingAmount = newFinalPcs * priceMaster.fourPTeching;
    updatedLotData.fourPAmount = newFinalPcs * findRate(originalLot.carat, fourPRates);


    setFourPTechingLots(prev =>
      prev.map(lot => (lot.id === lotId ? { ...lot, ...updatedLotData } : lot))
    );
    toast({ title: 'Success', description: 'Lot updated successfully.' });
    handleCancelEdit();
  };

  const handleEditFormChange = (field: keyof FourPLot, value: string | number) => {
      setEditFormData(prev => ({...prev, [field]: value}));
  }

  const recentEntries = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return fourPTechingLots
      .filter(lot => {
          if (lot.isReturnedToFourP) return false;
          if (!searchTerm) return true;
          return lot.lot.toLowerCase().includes(searchLower) ||
                 lot.kapan.toLowerCase().includes(searchLower);
      })
      .sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate!).getTime());
  }, [fourPTechingLots, searchTerm]);

  const departmentNames = useMemo(() => {
    return [deptSettings.belowThresholdDeptName, deptSettings.aboveThresholdDeptName];
  },[deptSettings]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="4P Teching Entry" description="Create a new entry for 4P Teching work." />
      
      <Card>
        <CardHeader>
            <CardTitle>Today's Lots Created</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-4xl font-bold">{todaysLotCount}</p>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Create New Lot</CardTitle>
            <CardDescription>Follow the steps to scan barcodes and enter details to create a new lot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              {/* Step 1: Lot Barcode */}
              <div>
                <Label htmlFor="barcode-scan">Step 1: Scan Lot Barcode</Label>
                <form onSubmit={handleLotBarcodeScan} className="flex gap-2 max-w-sm mt-1">
                    <Input
                        id="barcode-scan"
                        placeholder="Scan lot barcode (e.g., 61-B-1057)"
                        value={lotBarcode}
                        onChange={e => setLotBarcode(e.target.value)}
                        disabled={!!lotDetails}
                    />
                    <Button type="submit" disabled={!!lotDetails}>
                        <Barcode className="mr-2 h-4 w-4" /> Scan
                    </Button>
                </form>
              </div>

            {lotDetails && (
                <div className="space-y-6 animate-in fade-in-50">
                    <Alert variant="default">
                        <Barcode className="h-4 w-4"/>
                        <AlertTitle>Lot Scanned</AlertTitle>
                        <AlertDescription>Creating entry for Kapan: <span className="font-bold">{lotDetails.kapan}</span>, Lot: <span className="font-bold">{lotDetails.lot}</span></AlertDescription>
                    </Alert>

                     {/* Step 2: Hire Barcode */}
                    <div>
                        <Label htmlFor="hire-barcode-scan">Step 2: Scan Hire Barcode</Label>
                        <form onSubmit={handleHireBarcodeScan} className="flex gap-2 max-w-sm mt-1">
                            <Input
                                id="hire-barcode-scan"
                                ref={hireInputRef}
                                placeholder="Scan hire barcode..."
                                value={hireBarcode}
                                onChange={e => setHireBarcode(e.target.value)}
                                disabled={!!hireDetails}
                            />
                            <Button type="submit" disabled={!!hireDetails}>
                                <Weight className="mr-2 h-4 w-4" /> Scan Hire
                            </Button>
                        </form>
                    </div>

                    {hireDetails && (
                        <div className="space-y-6 animate-in fade-in-50">
                            <Alert variant="default">
                                <Tag className="h-4 w-4"/>
                                <AlertTitle>Hire Scanned & Processed</AlertTitle>
                                <AlertDescription>
                                    Carat Weight: <span className="font-bold">{hireDetails.carat}</span>. 
                                    Assigned to Department: <Badge>{hireDetails.department}</Badge>
                                </AlertDescription>
                            </Alert>

                            {/* Step 3 & 4: Operator and PCS */}
                            <div className="grid md:grid-cols-3 gap-4 max-w-lg">
                                <div>
                                    <Label htmlFor="teching-op">Step 3: Select Teching Operator</Label>
                                    <Select onValueChange={setTechingOperator} value={techingOperator}>
                                        <SelectTrigger id="teching-op" className="mt-1"><SelectValue placeholder="Select Operator" /></SelectTrigger>
                                        <SelectContent>{fourPTechingOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="pcs-entry">Step 4: Enter Total PCS</Label>
                                    <Input id="pcs-entry" ref={pcsInputRef} value={pcs} onChange={e => setPcs(e.target.value)} onKeyDown={handlePcsKeyDown} type="number" placeholder="e.g., 25" className="mt-1"/>
                                </div>
                                <div>
                                    <Label htmlFor="blocking-pcs-entry">Step 5: Blocking PCS</Label>
                                    <Input id="blocking-pcs-entry" ref={blockingInputRef} value={blocking} onChange={e => setBlocking(e.target.value)} onKeyDown={handleBlockingKeyDown} type="number" placeholder="e.g., 2" className="mt-1"/>
                                </div>
                            </div>

                            {/* Step 6: Save */}
                            <div className="flex gap-2">
                                <Button onClick={handleSaveLot}>Save Lot</Button>
                                <Button variant="outline" onClick={() => { setLotDetails(null); setHireDetails(null); setLotBarcode(''); setHireBarcode(''); }}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </CardContent>
        </Card>
     
       <Card>
        <CardHeader>
          <CardTitle>Recent Teching Entries (Pending Return)</CardTitle>
           <div className="pt-4">
              <Input
                  placeholder="Search by Lot or Kapan Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
              />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Kapan</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Dept</TableHead>
                      <TableHead>Carat</TableHead>
                      <TableHead>Total PCS</TableHead>
                      <TableHead>Blocking</TableHead>
                      <TableHead>Final PCS</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                      <TableHead>Entry Date</TableHead>
                      <TableHead>Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map(lot => (
                  <TableRow key={lot.id}>
                    {editingLotId === lot.id ? (
                        <>
                            <TableCell>{lot.kapan}</TableCell>
                            <TableCell>{lot.lot}</TableCell>
                            <TableCell>
                                <Select value={editFormData.department} onValueChange={(val) => handleEditFormChange('department', val)}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {departmentNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>{lot.carat}</TableCell>
                            <TableCell><Input type="number" value={editFormData.pcs} onChange={(e) => handleEditFormChange('pcs', parseInt(e.target.value))} className="w-20" /></TableCell>
                            <TableCell><Input type="number" value={editFormData.blocking} onChange={(e) => handleEditFormChange('blocking', parseInt(e.target.value))} className="w-20" /></TableCell>
                            <TableCell className="font-bold">{(editFormData.pcs || 0) - (editFormData.blocking || 0)}</TableCell>
                            <TableCell>
                                <Select value={editFormData.techingOperator} onValueChange={(val) => handleEditFormChange('techingOperator', val)}>
                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{fourPTechingOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>₹{(((editFormData.pcs || 0) - (editFormData.blocking || 0)) * priceMaster.fourPTeching).toFixed(2)}</TableCell>
                            <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                            <TableCell className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(lot.id)}><Save className="h-4 w-4 text-green-600" /></Button>
                                <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4 text-red-600" /></Button>
                            </TableCell>
                        </>
                    ) : (
                        <>
                            <TableCell>{lot.kapan}</TableCell>
                            <TableCell>{lot.lot}</TableCell>
                            <TableCell><Badge>{lot.department}</Badge></TableCell>
                            <TableCell>{lot.carat.toFixed(3)}</TableCell>
                            <TableCell>{lot.pcs}</TableCell>
                            <TableCell className="text-destructive font-medium">{lot.blocking}</TableCell>
                            <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                            <TableCell>{lot.techingOperator}</TableCell>
                            <TableCell>₹{lot.techingAmount?.toFixed(2)}</TableCell>
                            <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                            <TableCell className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(lot)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteLot(lot.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </>
                    )}
                  </TableRow>
                ))}
                 {recentEntries.length === 0 && <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground">No recent entries found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

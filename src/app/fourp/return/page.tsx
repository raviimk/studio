
'use client';
import React, { useState, useMemo, useReducer } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_OPERATORS_KEY, PRICE_MASTER_KEY, FOURP_DEPARTMENT_SETTINGS_KEY } from '@/lib/constants';
import { FourPLot, FourPOperator, PriceMaster, FourPDepartmentSettings, FourPData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Edit, Save, Trash2, X, Users, User, GitMerge } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';


export default function FourPReturnPage() {
  const { toast } = useToast();
  const [fourPTechingLots, setFourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [fourPOperators] = useLocalStorage<FourPOperator[]>(FOURP_OPERATORS_KEY, []);
  const [priceMaster] = useLocalStorage<PriceMaster>(PRICE_MASTER_KEY, { fourP: 0, fourPTeching: 0 });
  const [deptSettings] = useLocalStorage<FourPDepartmentSettings>(FOURP_DEPARTMENT_SETTINGS_KEY, { caratThreshold: 0.009, aboveThresholdDeptName: 'Big Dept', belowThresholdDeptName: 'Small Dept' });


  const [selectedOperator, setSelectedOperator] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lotToReturn, setLotToReturn] = useState<FourPLot | null>(null);
  const [returnedSearchTerm, setReturnedSearchTerm] = useState('');
  
  // State for editing returned lots
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FourPLot>>({});
  
  // State for split return
  const [isReturnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnType, setReturnType] = useState<'full' | 'split'>('full');
  const [splitOperator, setSplitOperator] = useState('');
  const [splitPcs, setSplitPcs] = useState('');


  const handleConfirmReturn = () => {
    if (!selectedOperator || !lotToReturn) {
        toast({ variant: 'destructive', title: 'Error', description: 'Primary operator or Lot not selected.' });
        return;
    }

    const totalFinalPcs = lotToReturn.finalPcs || 0;
    const rate = priceMaster?.fourP ?? 0;
    let fourPData: FourPData[] = [];

    if (returnType === 'full') {
        fourPData.push({
            operator: selectedOperator,
            pcs: totalFinalPcs,
            amount: totalFinalPcs * rate
        });
    } else { // split
        const numSplitPcs = parseInt(splitPcs, 10);
        if (!splitOperator || !splitPcs || isNaN(numSplitPcs) || numSplitPcs <= 0 || numSplitPcs >= totalFinalPcs) {
            toast({ variant: 'destructive', title: 'Invalid Split', description: `Please select a second operator and enter a valid number of pieces (between 1 and ${totalFinalPcs - 1}).` });
            return;
        }
        
        const primaryPcs = totalFinalPcs - numSplitPcs;

        fourPData.push({
            operator: selectedOperator,
            pcs: primaryPcs,
            amount: primaryPcs * rate
        });
        fourPData.push({
            operator: splitOperator,
            pcs: numSplitPcs,
            amount: numSplitPcs * rate
        });
    }

    const updatedLots = (fourPTechingLots || []).map(lot =>
        lot.id === lotToReturn.id
        ? {
            ...lot,
            isReturnedToFourP: true,
            returnDate: new Date().toISOString(),
            fourPData: fourPData,
            // For backward compatibility, store primary operator here too
            fourPOperator: selectedOperator,
            fourPAmount: fourPData.reduce((sum, d) => sum + d.amount, 0),
          }
        : lot
    );

    setFourPTechingLots(updatedLots);
    toast({ title: `Lot Returned`, description: `Return processed successfully.` });
    setReturnDialogOpen(false); // Close dialog
  };

  const openReturnDialog = (lot: FourPLot) => {
    if (!selectedOperator) {
        toast({ variant: 'destructive', title: 'Select Operator', description: 'Please select the primary return operator first.' });
        return;
    }
    setLotToReturn(lot);
    setReturnType('full');
    setSplitOperator('');
    setSplitPcs('');
    setReturnDialogOpen(true);
  };
  
  const unreturnedLots = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return (fourPTechingLots || []).filter(lot => {
        if (lot.isReturnedToFourP) return false;
        if (!searchTerm) return true;
        return lot.lot.toLowerCase().includes(searchLower) ||
               lot.kapan.toLowerCase().includes(searchLower);
    });
  }, [fourPTechingLots, searchTerm]);

  const returnedLots = useMemo(() => {
    const searchLower = returnedSearchTerm.toLowerCase();
    return (fourPTechingLots || [])
      .filter(lot => {
          if (!lot.isReturnedToFourP) return false;
          if (!returnedSearchTerm) return true;
          
          const operatorMatch = lot.fourPData
            ? lot.fourPData.some(d => d.operator.toLowerCase().includes(searchLower))
            : (lot.fourPOperator ?? '').toLowerCase().includes(searchLower);

          return lot.lot.toLowerCase().includes(searchLower) ||
                 lot.kapan.toLowerCase().includes(searchLower) ||
                 operatorMatch;
      })
      .sort((a,b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime());
  }, [fourPTechingLots, returnedSearchTerm]);
  
  const departmentNames = useMemo(() => {
    return [deptSettings?.belowThresholdDeptName, deptSettings?.aboveThresholdDeptName].filter(Boolean) as string[];
  },[deptSettings]);

  // Edit/Delete handlers for returned lots
  const handleEditClick = (lot: FourPLot) => {
      setEditingLotId(lot.id);
      setEditFormData({
          fourPOperator: lot.fourPOperator,
          pcs: lot.pcs,
          blocking: lot.blocking,
          department: lot.department,
          fourPData: lot.fourPData,
      });
  };

  const handleCancelEdit = () => {
      setEditingLotId(null);
      setEditFormData({});
  };

  const handleSaveEdit = (lotId: string) => {
    const updatedLotData = { ...editFormData };

    const totalPcs = updatedLotData.pcs || 0;
    const blockingPcs = updatedLotData.blocking || 0;

    if (blockingPcs > totalPcs) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Blocking PCS cannot be greater than Total PCS.' });
        return;
    }
    
    const newFinalPcs = totalPcs - blockingPcs;
    updatedLotData.finalPcs = newFinalPcs;

    // Recalculate amounts for split data if it exists
    if (updatedLotData.fourPData && updatedLotData.fourPData.length > 0) {
        let remainingPcs = newFinalPcs;
        updatedLotData.fourPData = updatedLotData.fourPData.map((d, index) => {
            // Assume the last operator's PCS is the one to adjust if total changes
            if (index === updatedLotData.fourPData!.length - 1) {
                const pcs = remainingPcs;
                return { ...d, pcs, amount: pcs * (priceMaster?.fourP ?? 0) };
            }
            remainingPcs -= d.pcs;
            return d;
        });
        updatedLotData.fourPAmount = updatedLotData.fourPData.reduce((sum, d) => sum + d.amount, 0);

    } else { // Handle legacy single operator
       updatedLotData.fourPAmount = newFinalPcs * (priceMaster?.fourP ?? 0);
    }

    updatedLotData.techingAmount = newFinalPcs * (priceMaster?.fourPTeching ?? 0);

    setFourPTechingLots(prev =>
        (prev || []).map(lot => (lot.id === lotId ? { ...lot, ...updatedLotData } : lot))
    );
    toast({ title: 'Success', description: 'Lot updated successfully.' });
    handleCancelEdit();
  };
  
  const handleDeleteLot = (lotId: string) => {
      setFourPTechingLots(prev => (prev || []).filter(lot => lot.id !== lotId));
      toast({title: 'Success', description: 'Lot entry deleted.'});
  }

  const handleEditFormChange = (field: keyof FourPLot, value: string | number | undefined) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };


  return (
    <>
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="4P Return" description="Process the return of lots from 4P operators." />

      <Card>
        <CardHeader>
            <CardTitle>Lots Pending 4P Return</CardTitle>
            <div className='pt-4 grid md:grid-cols-2 gap-4'>
                <div>
                    <Label htmlFor="search-lot">Search Lot or Kapan</Label>
                    <Input
                        id="search-lot"
                        placeholder="Enter lot or kapan number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="4p-operator-select">Select Primary Return Operator</Label>
                    <Select onValueChange={setSelectedOperator} value={selectedOperator}>
                        <SelectTrigger id="4p-operator-select" className="mt-1">
                            <SelectValue placeholder="Select 4P Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            {(fourPOperators || []).map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Dept</TableHead><TableHead>Blocking</TableHead><TableHead>Final PCS</TableHead><TableHead>4P Amount (₹)</TableHead><TableHead>Teching Operator</TableHead><TableHead>Entry Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {unreturnedLots.map(lot => {
                  const fourPAmount = (lot.finalPcs || 0) * (priceMaster?.fourP ?? 0);
                  return (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell><Badge>{lot.department}</Badge></TableCell>
                    <TableCell className="text-destructive font-medium">{lot.blocking}</TableCell>
                    <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                    <TableCell className="font-bold text-green-600">₹{(fourPAmount ?? 0).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{lot.techingOperator}</Badge></TableCell>
                    <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                    <TableCell>
                        <Button onClick={() => openReturnDialog(lot)} disabled={!selectedOperator}>Return to 4P</Button>
                    </TableCell>
                  </TableRow>
                )})}
                {unreturnedLots.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No lots are pending return.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
            <CardTitle>Recently Returned Lots</CardTitle>
            <div className="pt-4">
                <Label htmlFor="search-returned-lot">Search Returned Lots (by Lot, Kapan, or Operator)</Label>
                <Input
                    id="search-returned-lot"
                    placeholder="Enter search term..."
                    value={returnedSearchTerm}
                    onChange={(e) => setReturnedSearchTerm(e.target.value)}
                    className="mt-1 max-w-sm"
                />
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Dept</TableHead><TableHead>Total PCS</TableHead><TableHead>Blocking</TableHead><TableHead>Final PCS</TableHead><TableHead>4P Operator(s)</TableHead><TableHead>4P Amount (₹)</TableHead><TableHead>Return Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {returnedLots.map(lot => (
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
                           <TableCell>
                                <Input type="number" value={editFormData.pcs || ''} onChange={(e) => handleEditFormChange('pcs', e.target.value ? parseInt(e.target.value, 10) : undefined)} className="w-20" />
                           </TableCell>
                           <TableCell>
                                <Input type="number" value={editFormData.blocking || ''} onChange={(e) => handleEditFormChange('blocking', e.target.value ? parseInt(e.target.value, 10) : undefined)} className="w-20" />
                           </TableCell>
                           <TableCell className="font-bold">
                                {((editFormData.pcs || 0) - (editFormData.blocking || 0))}
                           </TableCell>
                           <TableCell>
                                <Select value={editFormData.fourPOperator} onValueChange={(val) => handleEditFormChange('fourPOperator', val)}>
                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{(fourPOperators || []).map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                                </Select>
                           </TableCell>
                           <TableCell>₹{(((editFormData.pcs || 0) - (editFormData.blocking || 0)) * (priceMaster?.fourP ?? 0)).toFixed(2)}</TableCell>
                           <TableCell>{lot.returnDate ? format(new Date(lot.returnDate), 'PPp') : 'N/A'}</TableCell>
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
                            <TableCell>{lot.pcs}</TableCell>
                            <TableCell className="text-destructive font-medium">{lot.blocking}</TableCell>
                            <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                {lot.fourPData && lot.fourPData.length > 0 ? (
                                    lot.fourPData.map(d => (
                                        <Badge key={d.operator} variant="secondary">{d.operator} ({d.pcs} pcs)</Badge>
                                    ))
                                ) : <Badge>{lot.fourPOperator}</Badge>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                {lot.fourPData && lot.fourPData.length > 1 ? (
                                    lot.fourPData.map(d => (
                                        <Badge key={d.operator} variant="outline">₹{d.amount.toFixed(2)}</Badge>
                                    ))
                                ) : (
                                `₹${(lot.fourPAmount ?? 0).toFixed(2)}`
                                )}
                                </div>
                            </TableCell>
                            <TableCell>{lot.returnDate ? format(new Date(lot.returnDate), 'PPp') : 'N/A'}</TableCell>
                             <TableCell className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(lot)}><Edit className="h-4 w-4" /></Button>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Are you sure?</DialogTitle>
                                            <DialogDescription>
                                                This action will permanently delete the entry for Lot <span className="font-bold">{lot.lot}</span>. This cannot be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                            <DialogClose asChild><Button variant="destructive" onClick={() => handleDeleteLot(lot.id)}>Delete</Button></DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                        </>
                    )}
                  </TableRow>
                ))}
                 {returnedLots.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">No lots returned yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog open={isReturnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Return Lot: {lotToReturn?.lot}</DialogTitle>
                <DialogDescription>
                    Final PCS: <span className="font-bold">{lotToReturn?.finalPcs}</span>. Primary Operator: <span className="font-bold">{selectedOperator}</span>
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <RadioGroup value={returnType} onValueChange={(val) => setReturnType(val as 'full' | 'split')} className="grid grid-cols-2 gap-4">
                     <Label htmlFor="type-full" className="flex flex-col items-center justify-center gap-2 border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary">
                         <User className="h-8 w-8" />
                         <RadioGroupItem value="full" id="type-full" className="sr-only" />
                         Full Return
                      </Label>
                      <Label htmlFor="type-split" className="flex flex-col items-center justify-center gap-2 border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary">
                         <Users className="h-8 w-8" />
                         <RadioGroupItem value="split" id="type-split" className="sr-only" />
                         Split Return
                      </Label>
                </RadioGroup>

                {returnType === 'split' && (
                    <div className="space-y-4 pt-4 border-t animate-in fade-in-50">
                        <h4 className="font-semibold text-center">Split Details</h4>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div>
                                <Label>Second Operator</Label>
                                <Select value={splitOperator} onValueChange={setSplitOperator}>
                                    <SelectTrigger><SelectValue placeholder="Select 2nd operator" /></SelectTrigger>
                                    <SelectContent>
                                        {(fourPOperators || []).filter(op => op.name !== selectedOperator).map(op => (
                                            <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="split-pcs">PCS for 2nd Operator</Label>
                                <Input id="split-pcs" type="number" placeholder="e.g., 5" value={splitPcs} onChange={(e) => setSplitPcs(e.target.value)} />
                            </div>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                            {selectedOperator} will be assigned the remaining <span className="font-bold">{(lotToReturn?.finalPcs || 0) - (parseInt(splitPcs, 10) || 0)}</span> pieces.
                        </div>
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleConfirmReturn}><GitMerge className="mr-2 h-4 w-4" />Confirm Return</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

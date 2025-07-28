
'use client';
import React, { useState, useMemo, useReducer } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_OPERATORS_KEY, PRICE_MASTER_KEY, FOURP_DEPARTMENT_SETTINGS_KEY } from '@/lib/constants';
import { FourPLot, FourPOperator, PriceMaster, FourPDepartmentSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Save, Trash2, X } from 'lucide-react';


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


  const handleConfirmReturn = () => {
     if (!selectedOperator || !lotToReturn) {
      toast({ variant: 'destructive', title: 'Error', description: 'Operator or Lot not selected.' });
      return;
    }

    const fourPAmount = (lotToReturn.finalPcs || 0) * priceMaster.fourP;
    
    const updatedLots = fourPTechingLots.map(lot =>
      lot.id === lotToReturn.id
        ? {
            ...lot,
            isReturnedToFourP: true,
            fourPOperator: selectedOperator,
            fourPAmount,
            returnDate: new Date().toISOString(),
          }
        : lot
    );
    setFourPTechingLots(updatedLots);
    toast({ title: `Lot Returned`, description: `Assigned to ${selectedOperator}. Amount: ₹${fourPAmount.toFixed(2)}` });
    setLotToReturn(null);
  };
  
  const unreturnedLots = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return fourPTechingLots.filter(lot => {
        if (lot.isReturnedToFourP) return false;
        if (!searchTerm) return true;
        return lot.lot.toLowerCase().includes(searchLower) ||
               lot.kapan.toLowerCase().includes(searchLower);
    });
  }, [fourPTechingLots, searchTerm]);

  const returnedLots = useMemo(() => {
    const searchLower = returnedSearchTerm.toLowerCase();
    return fourPTechingLots
      .filter(lot => {
          if (!lot.isReturnedToFourP) return false;
          if (!returnedSearchTerm) return true;
          return lot.lot.toLowerCase().includes(searchLower) ||
                 lot.kapan.toLowerCase().includes(searchLower) ||
                 lot.fourPOperator?.toLowerCase().includes(searchLower);
      })
      .sort((a,b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime());
  }, [fourPTechingLots, returnedSearchTerm]);
  
  const departmentNames = useMemo(() => {
    return [deptSettings.belowThresholdDeptName, deptSettings.aboveThresholdDeptName];
  },[deptSettings]);

  // Edit/Delete handlers for returned lots
  const handleEditClick = (lot: FourPLot) => {
      setEditingLotId(lot.id);
      setEditFormData({
          fourPOperator: lot.fourPOperator,
          pcs: lot.pcs,
          blocking: lot.blocking,
          department: lot.department,
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
      updatedLotData.fourPAmount = newFinalPcs * priceMaster.fourP;

      setFourPTechingLots(prev =>
          prev.map(lot => (lot.id === lotId ? { ...lot, ...updatedLotData } : lot))
      );
      toast({ title: 'Success', description: 'Lot updated successfully.' });
      handleCancelEdit();
  };
  
  const handleDeleteLot = (lotId: string) => {
      setFourPTechingLots(prev => prev.filter(lot => lot.id !== lotId));
      toast({title: 'Success', description: 'Lot entry deleted.'});
  }

  const handleEditFormChange = (field: keyof FourPLot, value: string | number) => {
      setEditFormData(prev => ({ ...prev, [field]: value }));
  };


  return (
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
                    <Label htmlFor="4p-operator-select">Select 4P Operator to Assign Return</Label>
                    <Select onValueChange={setSelectedOperator} value={selectedOperator}>
                        <SelectTrigger id="4p-operator-select" className="mt-1">
                            <SelectValue placeholder="Select 4P Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            {fourPOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
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
                  const fourPAmount = (lot.finalPcs || 0) * priceMaster.fourP;
                  return (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell><Badge>{lot.department}</Badge></TableCell>
                    <TableCell className="text-destructive font-medium">{lot.blocking}</TableCell>
                    <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                    <TableCell className="font-bold text-green-600">₹{fourPAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{lot.techingOperator}</Badge></TableCell>
                    <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button onClick={() => setLotToReturn(lot)} disabled={!selectedOperator}>Return to 4P</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Lot Return</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to return Lot <span className="font-bold">{lot.lot}</span> to the operator <span className="font-bold">{selectedOperator}</span>? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmReturn}>Confirm Return</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Dept</TableHead><TableHead>Total PCS</TableHead><TableHead>Blocking</TableHead><TableHead>Final PCS</TableHead><TableHead>4P Operator</TableHead><TableHead>4P Amount (₹)</TableHead><TableHead>Return Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
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
                                <Input type="number" value={editFormData.pcs} onChange={(e) => handleEditFormChange('pcs', parseInt(e.target.value, 10))} className="w-20" />
                           </TableCell>
                           <TableCell>
                                <Input type="number" value={editFormData.blocking} onChange={(e) => handleEditFormChange('blocking', parseInt(e.target.value, 10))} className="w-20" />
                           </TableCell>
                           <TableCell className="font-bold">
                                {((editFormData.pcs || 0) - (editFormData.blocking || 0))}
                           </TableCell>
                           <TableCell>
                                <Select value={editFormData.fourPOperator} onValueChange={(val) => handleEditFormChange('fourPOperator', val)}>
                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{fourPOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                                </Select>
                           </TableCell>
                           <TableCell>₹{(((editFormData.pcs || 0) - (editFormData.blocking || 0)) * priceMaster.fourP).toFixed(2)}</TableCell>
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
                            <TableCell><Badge>{lot.fourPOperator}</Badge></TableCell>
                            <TableCell>₹{lot.fourPAmount?.toFixed(2)}</TableCell>
                            <TableCell>{lot.returnDate ? format(new Date(lot.returnDate), 'PPp') : 'N/A'}</TableCell>
                             <TableCell className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(lot)}><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently delete the entry for Lot <span className="font-bold">{lot.lot}</span>. This cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteLot(lot.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
  );
}

    
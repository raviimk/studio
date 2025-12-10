
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Maximize, Minimize, Save, PlusCircle, Edit, Trash2, FileText } from 'lucide-react';
import { useLayout } from '@/hooks/useLayout';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
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


type Kapan = {
    id: string;
    kapanNumber: string;
};

export default function ChaluEntryPage() {
  const { toast } = useToast();
  const { isFullscreen, setFullscreen } = useLayout();
  const router = useRouter();

  const firestore = useFirestore();
  
  const chaluEntriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'chaluEntries'));
  }, [firestore]);

  const kapansQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'kapans'));
  }, [firestore]);

  const { data: chaluEntries, loading: loadingEntries } = useCollection(chaluEntriesQuery);
  const { data: kapans, loading: loadingKapans } = useCollection<Kapan>(kapansQuery);
  
  const [kapanNumber, setKapanNumber] = useState('');
  const [packetNumber, setPacketNumber] = useState('');
  const [vajan, setVajan] = useState('');
  const [originalPcs, setOriginalPcs] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [suffix, setSuffix] = useState('');
  const [currentPcs, setCurrentPcs] = useState('');
  const [kapanFilter, setKapanFilter] = useState('');
  const [isReportOpen, setReportOpen] = useState(false);
  
  // State for new kapan dialog
  const [isKapanDialogOpen, setKapanDialogOpen] = useState(false);
  const [newKapanNumber, setNewKapanNumber] = useState('');

  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Use refs to store the latest state for the cleanup function
  const stateRef = useRef({
      kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment,
      editingId, editFormData, firestore, toast
  });

  useEffect(() => {
      stateRef.current = {
          kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment,
          editingId, editFormData, firestore, toast
      };
  }, [kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment, editingId, editFormData, firestore, toast]);

  const originalCount = parseInt(originalPcs, 10) || 0;
  const adjustmentValue = parseInt(adjustment, 10) || 0;
  
  useEffect(() => {
    const calculatedCurrent = originalCount + adjustmentValue;
    setCurrentPcs(String(calculatedCurrent));

    if (adjustmentValue > 0) {
      if (originalCount > 0) {
        const suffixes = [];
        for (let i = 0; i < adjustmentValue; i++) {
          const nextSuffixCharCode = 'A'.charCodeAt(0) + originalCount + i;
          suffixes.push(String.fromCharCode(nextSuffixCharCode));
        }
        setSuffix(suffixes.join(', '));
      } else {
        setSuffix('');
      }
    } else if (adjustmentValue < 0) {
        if (originalCount > 0) {
            const suffixes = [];
            for (let i = 0; i < Math.abs(adjustmentValue); i++) {
                if (originalCount - 1 - i < 0) break; // Don't go below 'A'
                const charCode = 'A'.charCodeAt(0) + originalCount - 1 - i;
                suffixes.unshift(`-${String.fromCharCode(charCode)}`);
            }
            setSuffix(suffixes.join(', '));
        } else {
            setSuffix('');
        }
    } else {
      setSuffix('');
    }
  }, [originalCount, adjustmentValue]);

  const handleSave = async (showToast = true) => {
    const { firestore, kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment } = stateRef.current;
    if (!firestore) {
        if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
        return false;
    }
    
    if(!kapanNumber || !packetNumber || !vajan || !originalPcs || !currentPcs) {
        if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
        return false;
    }

    try {
        await addDoc(collection(firestore, 'chaluEntries'), {
            kapanNumber,
            packetNumber,
            vajan: parseFloat(vajan) || 0,
            originalPcs: parseInt(originalPcs, 10) || 0,
            adjustment: parseInt(adjustment, 10) || 0,
            suffix,
            currentPcs: parseInt(currentPcs, 10) || 0,
            createdAt: serverTimestamp(),
        });
        if(showToast) toast({ title: 'Success', description: 'Chalu entry saved successfully.' });
        // Reset form
        setPacketNumber('');
        setVajan('');
        setOriginalPcs('');
        setAdjustment('');
        setSuffix('');
        setCurrentPcs('');
        return true;

    } catch (e) {
        console.error('Error adding document: ', e);
        if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'Could not save the entry.' });
        return false;
    }
  };

  const handleEditClick = (entry: any) => {
    setEditingId(entry.id);
    setEditFormData({ ...entry });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };
  
  const handleSaveEdit = async (id: string, showToast = true) => {
      const { firestore, editFormData } = stateRef.current;
    if (!firestore) return false;
    const docRef = doc(firestore, 'chaluEntries', id);
    const { id: _, ...dataToSave } = editFormData; // Exclude id from data
    
    // Ensure numeric fields are numbers
    dataToSave.vajan = parseFloat(dataToSave.vajan) || 0;
    dataToSave.originalPcs = parseInt(dataToSave.originalPcs, 10) || 0;
    dataToSave.adjustment = parseInt(dataToSave.adjustment, 10) || 0;
    dataToSave.currentPcs = parseInt(dataToSave.currentPcs, 10) || 0;

    try {
      await updateDoc(docRef, dataToSave);
      if(showToast) toast({ title: 'Updated', description: 'Entry updated successfully.'});
      handleCancelEdit();
      return true;
    } catch(e) {
      console.error("Error updating document:", e);
      if(showToast) toast({ variant: 'destructive', title: 'Update Failed' });
      return false;
    }
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleDeleteEntry = async (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'chaluEntries', id);
    try {
        await deleteDoc(docRef);
        toast({ title: 'Deleted', description: 'Entry removed successfully.'});
    } catch (e) {
        console.error("Error deleting document:", e);
        toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  }


  const handleAddKapan = async () => {
    if (!firestore || !newKapanNumber.trim()) return;

    const existingKapan = kapans?.find(k => k.kapanNumber === newKapanNumber.trim());
    if (existingKapan) {
        toast({ variant: 'destructive', title: 'Duplicate Kapan', description: 'This Kapan number already exists.' });
        return;
    }

    try {
        await addDoc(collection(firestore, 'kapans'), {
            kapanNumber: newKapanNumber.trim(),
        });
        toast({ title: 'Success', description: 'New Kapan added successfully.'});
        setNewKapanNumber('');
        setKapanDialogOpen(false);
    } catch (e) {
         console.error('Error adding Kapan: ', e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add the new Kapan.' });
    }
  }
  
  useEffect(() => {
    // Automatically enter fullscreen when component mounts
    setFullscreen(true);

    const autoSave = async () => {
        const { kapanNumber, packetNumber, editingId } = stateRef.current;
        // Autosave new entry if required fields are filled
        if (kapanNumber && packetNumber) {
            const success = await handleSave(false);
            if (success) {
                stateRef.current.toast({ title: 'Auto-saved', description: 'New entry was automatically saved.' });
            }
        }
        // Autosave edited entry
        if (editingId) {
            const success = await handleSaveEdit(editingId, false);
            if (success) {
                stateRef.current.toast({ title: 'Auto-saved', description: 'Your changes were automatically saved.' });
            }
        }
    };

    // This cleanup function will run when the component is unmounted (e.g., page navigation)
    return () => {
        autoSave();
        // Exit fullscreen when the component unmounts
        setFullscreen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleToggleFullscreen = () => {
      if (isFullscreen) {
          router.push('/');
      }
      setFullscreen(!isFullscreen);
  };

  const filteredEntries = useMemo(() => {
      if (!chaluEntries) return [];
      if (!kapanFilter) return chaluEntries;
      return chaluEntries.filter(entry => entry.kapanNumber.toLowerCase().includes(kapanFilter.toLowerCase()));
  }, [chaluEntries, kapanFilter]);

  const reportSummary = useMemo(() => {
    if (!kapanFilter || filteredEntries.length === 0) return null;
    
    let totalPlus = 0;
    let totalMinus = 0;
    let totalVajan = 0;

    filteredEntries.forEach(entry => {
        if (entry.kapanNumber.toLowerCase().includes(kapanFilter.toLowerCase())) {
            totalVajan += entry.vajan || 0;
            if (entry.adjustment > 0) {
                totalPlus += entry.adjustment;
            } else {
                totalMinus += entry.adjustment;
            }
        }
    });

    return {
        totalPlus,
        totalMinus,
        totalVajan: totalVajan.toFixed(3),
        totalEntries: filteredEntries.length,
        entries: filteredEntries.sort((a,b) => (a.packetNumber || '').localeCompare(b.packetNumber || '')),
    };
  }, [filteredEntries, kapanFilter]);


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader title="નુકશાની/ફાટેલા એન્ટ્રી" description="કાપણ પ્રમાણે નુકશાની ની યાદી." />
        <Button variant="ghost" size="icon" onClick={handleToggleFullscreen}>
            {isFullscreen ? <Minimize/> : <Maximize />}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>ATIXE PRO</CardTitle>
          <CardDescription>Select a lot and enter the number of packets completed or adjusted today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">કાપણ નંબર</label>
              <div className="flex gap-2">
                <Select value={kapanNumber} onValueChange={setKapanNumber}>
                    <SelectTrigger><SelectValue placeholder="કાપણ ?" /></SelectTrigger>
                    <SelectContent>
                    {kapans?.sort((a, b) => a.kapanNumber.localeCompare(b.kapanNumber, undefined, { numeric: true })).map(k => (
                        <SelectItem key={k.id} value={k.kapanNumber}>{k.kapanNumber}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Dialog open={isKapanDialogOpen} onOpenChange={setKapanDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon"><PlusCircle className="h-4 w-4"/></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Kapan</DialogTitle>
                            <DialogDescription>Create a new Kapan number that will be available in the dropdown.</DialogDescription>
                        </DialogHeader>
                        <Input value={newKapanNumber} onChange={(e) => setNewKapanNumber(e.target.value)} placeholder="Enter new Kapan number"/>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setKapanDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddKapan}>Save Kapan</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">પેકેટ નંબર</label>
              <Input 
                value={packetNumber}
                onChange={(e) => setPacketNumber(e.target.value)}
                placeholder="પેકેટ નંબર ?."
              />
            </div>
            <div>
              <label className="text-sm font-medium">ઓ.થાન</label>
              <Input 
                type="number"
                value={originalPcs}
                onChange={(e) => setOriginalPcs(e.target.value)}
                placeholder="ઓરિજિનલ કેટલા ?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">નુકશાની(+/-)</label>
              <Input 
                type="number" 
                value={adjustment} 
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="e.g., -1 or 5"
              />
            </div>
             <div>
              <label className="text-sm font-medium">પ્લસ/માઈનસ</label>
              <Input 
                value={suffix} 
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Auto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ટો.થાન</label>
              <Input 
                type="number"
                value={currentPcs} 
                onChange={(e) => setCurrentPcs(e.target.value)}
                className="font-bold text-lg"
              />
            </div>
             <div>
              <label className="text-sm font-medium">વજન(Weight)</label>
              <Input 
                type="number"
                value={vajan}
                onChange={(e) => setVajan(e.target.value)}
                placeholder="વજન લખો"
              />
            </div>
          </div>
          <Button onClick={() => handleSave(true)} className="mt-4">
            <Save className="mr-2" /> Save
          </Button>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>અત્યાર સુધી ની એન્ટ્રી</CardTitle>
              <div className="flex justify-between items-center">
                <CardDescription>Live log of all chalu entries. Click a field to edit.</CardDescription>
                <div className="flex gap-2 items-center">
                    <Input
                        placeholder="Filter by Kapan..."
                        value={kapanFilter}
                        onChange={(e) => setKapanFilter(e.target.value)}
                        className="max-w-xs"
                    />
                     <Dialog open={isReportOpen} onOpenChange={setReportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" disabled={!kapanFilter || !reportSummary}>
                                <FileText className="mr-2 h-4 w-4" /> View Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Full Report for Kapan: {kapanFilter}</DialogTitle>
                                <DialogDescription>A detailed summary and list of all entries for this Kapan.</DialogDescription>
                            </DialogHeader>
                            {reportSummary && (
                                <>
                                    <div className="mb-4 border rounded-lg p-4 bg-muted/50">
                                        <h3 className="font-semibold text-lg mb-2">Summary</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Total Entries</p>
                                                <p className="text-2xl font-bold">{reportSummary.totalEntries}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Total Weight</p>
                                                <p className="text-2xl font-bold">{reportSummary.totalVajan}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Total Plus</p>
                                                <p className="text-2xl font-bold text-green-600">+{reportSummary.totalPlus}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Total Minus</p>
                                                <p className="text-2xl font-bold text-destructive">{reportSummary.totalMinus}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="max-h-[50vh] overflow-y-auto">
                                        <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>પેકેટ</TableHead>
                                                  <TableHead>ઓરિજિનલ</TableHead>
                                                  <TableHead>નુકશાની</TableHead>
                                                  <TableHead>પ્લસ/માઈનસ</TableHead>
                                                  <TableHead>ટોટલ</TableHead>
                                                  <TableHead>વજન</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {reportSummary.entries.map(entry => (
                                                  <TableRow key={entry.id} className={cn(entry.adjustment < 0 && 'bg-destructive/10')}>
                                                      <TableCell>{entry.packetNumber}</TableCell>
                                                      <TableCell>{entry.originalPcs}</TableCell>
                                                      <TableCell className={cn(entry.adjustment > 0 ? "text-green-600" : entry.adjustment < 0 ? "text-destructive" : "", "font-semibold")}>
                                                          {entry.adjustment > 0 ? `+${entry.adjustment}` : entry.adjustment}
                                                      </TableCell>
                                                      <TableCell>{entry.suffix}</TableCell>
                                                      <TableCell className="font-bold">{entry.currentPcs}</TableCell>
                                                      <TableCell>{entry.vajan}</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </DialogContent>
                     </Dialog>
                </div>
              </div>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>કાપણ</TableHead>
                          <TableHead>પેકેટ</TableHead>
                          <TableHead>ઓરિજિનલ થાન</TableHead>
                          <TableHead>નુકશાની(+/-)</TableHead>
                          <TableHead>પ્લસ/માઈનસ</TableHead>
                          <TableHead>ટો.થાન</TableHead>
                          <TableHead>વજન</TableHead>
                          <TableHead>સુધારો</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loadingEntries && <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>}
                      {!loadingEntries && filteredEntries.map(entry => (
                      <TableRow key={entry.id} className={cn(entry.adjustment < 0 && 'bg-destructive/10')}>
                        {editingId === entry.id ? (
                            <>
                                <TableCell><Input name="kapanNumber" value={editFormData.kapanNumber} onChange={handleEditFormChange} /></TableCell>
                                <TableCell><Input name="packetNumber" value={editFormData.packetNumber} onChange={handleEditFormChange} /></TableCell>
                                <TableCell><Input type="number" name="originalPcs" value={editFormData.originalPcs} onChange={handleEditFormChange} /></TableCell>
                                <TableCell><Input type="number" name="adjustment" value={editFormData.adjustment} onChange={handleEditFormChange} /></TableCell>
                                <TableCell><Input name="suffix" value={editFormData.suffix} onChange={handleEditFormChange} /></TableCell>
                                <TableCell><Input type="number" name="currentPcs" value={editFormData.currentPcs} onChange={handleEditFormChange} /></TableCell>
                                <TableCell><Input type="number" name="vajan" value={editFormData.vajan} onChange={handleEditFormChange} /></TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={() => handleSaveEdit(entry.id, true)}><Save className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                                </TableCell>
                            </>
                        ) : (
                             <>
                                <TableCell>{entry.kapanNumber}</TableCell>
                                <TableCell>{entry.packetNumber}</TableCell>
                                <TableCell>{entry.originalPcs}</TableCell>
                                <TableCell className={cn(entry.adjustment > 0 ? "text-green-600" : entry.adjustment < 0 ? "text-destructive" : "", "font-semibold")}>
                                  {entry.adjustment > 0 ? `+${entry.adjustment}` : entry.adjustment}
                                </TableCell>
                                <TableCell>{entry.suffix}</TableCell>
                                <TableCell className="font-bold">{entry.currentPcs}</TableCell>
                                <TableCell>{entry.vajan}</TableCell>
                                <TableCell className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => handleEditClick(entry)}><Edit className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" className="w-9 p-0">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete the entry for packet {entry.packetNumber}.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </>
                        )}
                      </TableRow>
                      ))}
                      {!loadingEntries && filteredEntries.length === 0 && (
                          <TableRow><TableCell colSpan={8} className="text-center">No entries found.</TableCell></TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}

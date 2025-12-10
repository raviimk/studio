
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Maximize, Minimize, Save, PlusCircle, Edit } from 'lucide-react';
import { useLayout } from '@/hooks/useLayout';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, query } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

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
  
  // State for new kapan dialog
  const [isKapanDialogOpen, setKapanDialogOpen] = useState(false);
  const [newKapanNumber, setNewKapanNumber] = useState('');

  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});


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
    } else {
      setSuffix('');
    }
  }, [originalCount, adjustmentValue]);

  const handleSave = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
        return;
    }
    
    if(!kapanNumber || !packetNumber || !vajan || !originalPcs || !currentPcs) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
        return;
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
        toast({ title: 'Success', description: 'Chalu entry saved successfully.' });
        // Reset form
        setPacketNumber('');
        setVajan('');
        setOriginalPcs('');
        setAdjustment('');
        setSuffix('');
        setCurrentPcs('');

    } catch (e) {
        console.error('Error adding document: ', e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save the entry.' });
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
  
  const handleSaveEdit = async (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'chaluEntries', id);
    const { id: _, ...dataToSave } = editFormData; // Exclude id from data
    
    // Ensure numeric fields are numbers
    dataToSave.vajan = parseFloat(dataToSave.vajan) || 0;
    dataToSave.originalPcs = parseInt(dataToSave.originalPcs, 10) || 0;
    dataToSave.adjustment = parseInt(dataToSave.adjustment, 10) || 0;
    dataToSave.currentPcs = parseInt(dataToSave.currentPcs, 10) || 0;

    try {
      await updateDoc(docRef, dataToSave);
      toast({ title: 'Updated', description: 'Entry updated successfully.'});
      handleCancelEdit();
    } catch(e) {
      console.error("Error updating document:", e);
      toast({ variant: 'destructive', title: 'Update Failed' });
    }
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev: any) => ({ ...prev, [name]: value }));
  };


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
    // Exit fullscreen when the component unmounts
    return () => {
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


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader title="Chalu / Running Packet Entry" description="Log progress on active lots." />
        <Button variant="ghost" size="icon" onClick={handleToggleFullscreen}>
            {isFullscreen ? <Minimize/> : <Maximize />}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Log Production Progress</CardTitle>
          <CardDescription>Select a lot and enter the number of packets completed or adjusted today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">કાપણ નંબર</label>
              <div className="flex gap-2">
                <Select value={kapanNumber} onValueChange={setKapanNumber}>
                    <SelectTrigger><SelectValue placeholder="Select Kapan" /></SelectTrigger>
                    <SelectContent>
                    {kapans?.map(k => (
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
                placeholder="Enter packet no."
              />
            </div>
            <div>
              <label className="text-sm font-medium">ઓ.થાન</label>
              <Input 
                type="number"
                value={originalPcs}
                onChange={(e) => setOriginalPcs(e.target.value)}
                placeholder="Enter original count"
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
              <label className="text-sm font-medium">પ્લસ</label>
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
                placeholder="Enter weight"
              />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4">
            <Save className="mr-2" /> Save Progress
          </Button>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Entry Log</CardTitle>
              <div className="flex justify-between items-center">
                <CardDescription>Live log of all chalu entries. Click a field to edit.</CardDescription>
                <Input
                    placeholder="Filter by Kapan..."
                    value={kapanFilter}
                    onChange={(e) => setKapanFilter(e.target.value)}
                    className="max-w-xs"
                />
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
                          <TableHead>પ્લસ</TableHead>
                          <TableHead>ટો.થાન</TableHead>
                          <TableHead>વજન</TableHead>
                          <TableHead>સુધારો</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loadingEntries && <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>}
                      {!loadingEntries && filteredEntries.map(entry => (
                      <TableRow key={entry.id}>
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
                                    <Button size="sm" onClick={() => handleSaveEdit(entry.id)}><Save className="h-4 w-4" /></Button>
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
                                <TableCell>
                                    <Button size="sm" variant="outline" onClick={() => handleEditClick(entry)}><Edit className="h-4 w-4" /></Button>
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

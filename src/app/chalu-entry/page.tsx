
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
import { Maximize, Minimize, Save } from 'lucide-react';
import { useLayout } from '@/hooks/useLayout';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function ChaluEntryPage() {
  const { toast } = useToast();
  const { isFullscreen, setFullscreen } = useLayout();
  const router = useRouter();

  const firestore = useFirestore();
  const { data: chaluEntries, loading } = useCollection(firestore ? collection(firestore, 'chaluEntries') : null);
  
  const [kapanNumber, setKapanNumber] = useState('');
  const [packetNumber, setPacketNumber] = useState('');
  const [vajan, setVajan] = useState('');
  const [originalPcs, setOriginalPcs] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [suffix, setSuffix] = useState('');
  const [currentPcs, setCurrentPcs] = useState('');
  const [kapanFilter, setKapanFilter] = useState('');

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
        setKapanNumber('');
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

  const handleUpdate = async (id: string, field: string, value: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'chaluEntries', id);
    let updatedValue: string | number = value;
    if(field === 'vajan' || field === 'originalPcs' || field === 'adjustment' || field === 'currentPcs') {
        updatedValue = Number(value);
    }
    try {
      await updateDoc(docRef, { [field]: updatedValue });
      toast({ title: 'Updated', description: 'Field updated successfully.'});
    } catch(e) {
      console.error("Error updating document:", e);
      toast({ variant: 'destructive', title: 'Update Failed' });
    }
  };
  
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
              <label className="text-sm font-medium">Kapan Number</label>
              <Select value={kapanNumber} onValueChange={setKapanNumber}>
                <SelectTrigger><SelectValue placeholder="Select Kapan" /></SelectTrigger>
                <SelectContent>
                  {[...new Set(chaluEntries?.map(e => e.kapanNumber) || [])].map(kapan => (
                    <SelectItem key={kapan} value={kapan}>{kapan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">Packet Number</label>
              <Input 
                value={packetNumber}
                onChange={(e) => setPacketNumber(e.target.value)}
                placeholder="Enter packet no."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Original PCS</label>
              <Input 
                type="number"
                value={originalPcs}
                onChange={(e) => setOriginalPcs(e.target.value)}
                placeholder="Enter original count"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Adjustment (+/-)</label>
              <Input 
                type="number" 
                value={adjustment} 
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="e.g., -1 or 5"
              />
            </div>
             <div>
              <label className="text-sm font-medium">Suffix</label>
              <Input 
                value={suffix} 
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Auto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Current PCS</label>
              <Input 
                type="number"
                value={currentPcs} 
                onChange={(e) => setCurrentPcs(e.target.value)}
                className="font-bold text-lg"
              />
            </div>
             <div>
              <label className="text-sm font-medium">Vajan (Weight)</label>
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
                          <TableHead>Kapan / Packet</TableHead>
                          <TableHead>Vajan</TableHead>
                          <TableHead>Original</TableHead>
                          <TableHead>Adjustment</TableHead>
                          <TableHead>Suffix</TableHead>
                          <TableHead>Current</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading && <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>}
                      {!loading && filteredEntries.map(entry => (
                      <TableRow key={entry.id}>
                          <TableCell>
                            <Input 
                                defaultValue={`${entry.kapanNumber} / ${entry.packetNumber}`} 
                                className="font-medium"
                                onBlur={(e) => {
                                    const [kapan, packet] = e.target.value.split(' / ');
                                    if(kapan !== entry.kapanNumber) handleUpdate(entry.id, 'kapanNumber', kapan);
                                    if(packet !== entry.packetNumber) handleUpdate(entry.id, 'packetNumber', packet);
                                }}
                            />
                          </TableCell>
                          <TableCell><Input type="number" defaultValue={entry.vajan} onBlur={(e) => handleUpdate(entry.id, 'vajan', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" defaultValue={entry.originalPcs} onBlur={(e) => handleUpdate(entry.id, 'originalPcs', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" defaultValue={entry.adjustment} className={cn(entry.adjustment > 0 ? "text-green-600" : "text-destructive", "font-semibold")} onBlur={(e) => handleUpdate(entry.id, 'adjustment', e.target.value)} /></TableCell>
                          <TableCell><Input defaultValue={entry.suffix} onBlur={(e) => handleUpdate(entry.id, 'suffix', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" defaultValue={entry.currentPcs} className="font-bold" onBlur={(e) => handleUpdate(entry.id, 'currentPcs', e.target.value)} /></TableCell>
                      </TableRow>
                      ))}
                      {!loading && filteredEntries.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center">No entries found.</TableCell></TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );

    
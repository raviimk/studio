
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_TECHING_OPERATORS_KEY, PRICE_MASTER_KEY } from '@/lib/constants';
import { FourPLot, FourPTechingOperator, PriceMaster } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

type LotDetails = {
  kapan: string;
  lot: string;
};

export default function FourPTechingEntryPage() {
  const { toast } = useToast();
  const [fourPTechingLots, setFourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [fourPTechingOperators] = useLocalStorage<FourPTechingOperator[]>(FOURP_TECHING_OPERATORS_KEY, []);
  const [priceMaster] = useLocalStorage<PriceMaster>(PRICE_MASTER_KEY, { fourP: 0, fourPTeching: 0 });

  const [barcode, setBarcode] = useState('');
  const [lotDetails, setLotDetails] = useState<LotDetails | null>(null);
  
  const [techingOperator, setTechingOperator] = useState('');
  const [pcs, setPcs] = useState('');
  const [blocking, setBlocking] = useState('');

  const pcsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      // Auto-select operator if only one exists
      if(fourPTechingOperators.length === 1) {
          setTechingOperator(fourPTechingOperators[0].name);
      }
  }, [fourPTechingOperators]);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const match = barcode.match(/^(\d+)-[A-Z]-(\d+)$/);
    if (!match) {
      toast({ variant: 'destructive', title: 'Invalid Barcode Format', description: 'Expected format: Kapan-Bunch-Lot (e.g., 61-B-1057)' });
      return;
    }
    const [, kapan, lot] = match;

    const existingLot = fourPTechingLots.find(
      l => l.kapan === kapan && l.lot === lot && !l.isReturnedToFourP
    );
    if (existingLot) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Lot Number',
        description: `Lot Number ${lot} already exists for Kapan ${kapan}.`,
      });
      return;
    }

    setLotDetails({ kapan, lot });
    setTimeout(() => pcsInputRef.current?.focus(), 100);
  };
  
  const handleSaveLot = () => {
    if (!lotDetails || !techingOperator || !pcs) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields: barcode, operator, and PCS.' });
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

    const newLot: FourPLot = {
      id: uuidv4(),
      ...lotDetails,
      pcs: numPcs,
      blocking: numBlocking,
      finalPcs: finalPcs,
      techingOperator: techingOperator,
      techingAmount: techingAmount,
      entryDate: new Date().toISOString(),
      isReturnedToFourP: false,
    };
    setFourPTechingLots([...fourPTechingLots, newLot]);
    toast({ title: 'Success', description: `Lot created. Total: ${numPcs}, Final: ${finalPcs}` });

    // Reset state
    setBarcode('');
    setLotDetails(null);
    setPcs('');
    setBlocking('');
    if(fourPTechingOperators.length > 1) {
        setTechingOperator('');
    }
  };

  const handleDeleteLot = (lotId: string) => {
    if (window.confirm('Are you sure you want to delete this lot entry? This action cannot be undone.')) {
      setFourPTechingLots(fourPTechingLots.filter(lot => lot.id !== lotId));
      toast({ title: 'Success', description: 'Lot entry deleted.' });
    }
  };

  const recentEntries = fourPTechingLots.filter(lot => !lot.isReturnedToFourP).sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate!).getTime()).slice(0, 10);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="4P Teching Entry" description="Create a new entry for 4P Teching work." />

      <Card>
          <CardHeader>
            <CardTitle>Create New Lot</CardTitle>
            <CardDescription>Scan barcode and enter details to create a new lot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              {/* Step 1: Barcode */}
              <div>
                <Label htmlFor="barcode-scan">Step 1: Scan Lot Barcode</Label>
                <form onSubmit={handleBarcodeScan} className="flex gap-2 max-w-sm mt-1">
                    <Input
                        id="barcode-scan"
                        placeholder="Scan barcode (e.g., 61-B-1057)"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value)}
                        disabled={!!lotDetails}
                    />
                    <Button type="submit" disabled={!!lotDetails}>
                        <Barcode className="mr-2 h-4 w-4" /> Scan
                    </Button>
                </form>
              </div>

            {lotDetails && (
                <div className="space-y-6 animate-in fade-in-50">
                    <p className="text-sm text-muted-foreground">Creating entry for Kapan: <span className="font-bold">{lotDetails.kapan}</span>, Lot: <span className="font-bold">{lotDetails.lot}</span></p>

                    {/* Step 2 & 3: Operator and PCS */}
                    <div className="grid md:grid-cols-3 gap-4 max-w-lg">
                         <div>
                            <Label htmlFor="teching-op">Step 2: Select Teching Operator</Label>
                             <Select onValueChange={setTechingOperator} value={techingOperator}>
                                <SelectTrigger id="teching-op" className="mt-1"><SelectValue placeholder="Select Operator" /></SelectTrigger>
                                <SelectContent>{fourPTechingOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="pcs-entry">Step 3: Enter Total PCS</Label>
                            <Input id="pcs-entry" ref={pcsInputRef} value={pcs} onChange={e => setPcs(e.target.value)} type="number" placeholder="e.g., 25" className="mt-1"/>
                        </div>
                        <div>
                            <Label htmlFor="blocking-pcs-entry">Step 4: Blocking PCS</Label>
                            <Input id="blocking-pcs-entry" value={blocking} onChange={e => setBlocking(e.target.value)} type="number" placeholder="e.g., 2" className="mt-1"/>
                        </div>
                    </div>

                    {/* Step 5: Save */}
                    <div className="flex gap-2">
                        <Button onClick={handleSaveLot}>Save Lot</Button>
                        <Button variant="outline" onClick={() => { setLotDetails(null); setBarcode(''); }}>Cancel</Button>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
     
       <Card>
        <CardHeader><CardTitle>Recent Teching Entries (Pending Return)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Total PCS</TableHead><TableHead>Blocking</TableHead><TableHead>Final PCS</TableHead><TableHead>Operator</TableHead><TableHead>Amount (₹)</TableHead><TableHead>Entry Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentEntries.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell>{lot.pcs}</TableCell>
                    <TableCell className="text-destructive">{lot.blocking}</TableCell>
                    <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                    <TableCell>{lot.techingOperator}</TableCell>
                    <TableCell>₹{lot.techingAmount?.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLot(lot.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {recentEntries.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No recent entries found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

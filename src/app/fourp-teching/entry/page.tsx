
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

  const [packets, setPackets] = useState<string[]>([]);
  const [currentPacket, setCurrentPacket] = useState('');
  
  const [techingOperator, setTechingOperator] = useState('');
  const [pcs, setPcs] = useState('');

  const packetInputRef = useRef<HTMLInputElement>(null);
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
    setLotDetails({ kapan, lot });
    setTimeout(() => packetInputRef.current?.focus(), 100);
  };

  const handleAddPacket = () => {
    if (currentPacket.trim()) {
      setPackets([...packets, currentPacket.trim()]);
      setCurrentPacket('');
      packetInputRef.current?.focus();
    }
  };

  const handleDeletePacket = (index: number) => {
    setPackets(packets.filter((_, i) => i !== index));
  };
  
  const handleSaveLot = () => {
    if (!lotDetails || !techingOperator || !pcs) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields: barcode, operator, and PCS.' });
      return;
    }

    const numPcs = parseInt(pcs, 10);
    if (isNaN(numPcs) || numPcs <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid number for PCS.' });
        return;
    }
    
    const techingAmount = numPcs * priceMaster.fourPTeching;

    const newLot: FourPLot = {
      id: uuidv4(),
      ...lotDetails,
      packets,
      pcs: numPcs,
      techingOperator: techingOperator,
      techingAmount: techingAmount,
      entryDate: new Date().toISOString(),
      isReturnedToFourP: false,
    };
    setFourPTechingLots([...fourPTechingLots, newLot]);
    toast({ title: 'Success', description: '4P Teching Lot created successfully.' });

    // Reset state
    setBarcode('');
    setLotDetails(null);
    setPackets([]);
    setCurrentPacket('');
    setPcs('');
    if(fourPTechingOperators.length > 1) {
        setTechingOperator('');
    }
  };

  const recentEntries = fourPTechingLots.filter(lot => !lot.isReturnedToFourP).sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate!).getTime()).slice(0, 10);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="4P Teching Entry" description="Create a new entry for 4P Teching work." />

      <Card>
          <CardHeader>
            <CardTitle>Create New Lot</CardTitle>
            <CardDescription>Scan barcode, add packets, and enter details to create a new lot.</CardDescription>
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
                    {/* Step 2: Packet Entry */}
                    <div>
                        <Label>Step 2: Enter Packet Numbers (Optional)</Label>
                        <p className="text-sm text-muted-foreground">For Kapan: <span className="font-bold">{lotDetails.kapan}</span>, Lot: <span className="font-bold">{lotDetails.lot}</span></p>
                        <div className="flex gap-2 max-w-sm mt-1">
                            <Input
                                ref={packetInputRef}
                                placeholder="Enter packet number"
                                value={currentPacket}
                                onChange={e => setCurrentPacket(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPacket(); } }}
                            />
                            <Button onClick={handleAddPacket}>Add Packet</Button>
                        </div>
                        {packets.length > 0 && (
                            <div className="border rounded-md mt-2 max-w-sm">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Packet</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {packets.map((p, i) => (
                                            <TableRow key={i}><TableCell>{p}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeletePacket(i)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                    
                    {/* Step 3 & 4: Operator and PCS */}
                    <div className="grid md:grid-cols-2 gap-4 max-w-sm">
                         <div>
                            <Label htmlFor="teching-op">Step 3: Select Teching Operator</Label>
                             <Select onValueChange={setTechingOperator} value={techingOperator}>
                                <SelectTrigger id="teching-op" className="mt-1"><SelectValue placeholder="Select Operator" /></SelectTrigger>
                                <SelectContent>{fourPTechingOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="pcs-entry">Step 4: Enter Total PCS</Label>
                            <Input id="pcs-entry" ref={pcsInputRef} value={pcs} onChange={e => setPcs(e.target.value)} type="number" placeholder="e.g., 25" className="mt-1"/>
                        </div>
                    </div>

                    {/* Step 5: Save */}
                    <div className="flex gap-2">
                        <Button onClick={handleSaveLot}>Save Lot</Button>
                        <Button variant="outline" onClick={() => { setLotDetails(null); setBarcode(''); setPackets([]); }}>Cancel</Button>
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
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>PCS</TableHead><TableHead>Teching Operator</TableHead><TableHead>Amount (₹)</TableHead><TableHead>Entry Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentEntries.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell>{lot.pcs}</TableCell>
                    <TableCell>{lot.techingOperator}</TableCell>
                    <TableCell>{lot.techingAmount?.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                  </TableRow>
                ))}
                 {recentEntries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No recent entries found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

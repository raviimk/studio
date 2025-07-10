
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

  const packetInputRef = useRef<HTMLInputElement>(null);

  const [returningLotId, setReturningLotId] = useState<string | null>(null);
  const [operator, setOperator] = useState('');
  const [pcsReturned, setPcsReturned] = useState('');

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
    if (!lotDetails || packets.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please scan a barcode and add at least one packet.' });
      return;
    }
    const newLot: FourPLot = {
      id: uuidv4(),
      ...lotDetails,
      packets,
      isReturned: false,
      entryDate: new Date().toISOString(),
    };
    setFourPTechingLots([...fourPTechingLots, newLot]);
    toast({ title: 'Success', description: '4P Teching Lot created successfully.' });
    // Reset state
    setBarcode('');
    setLotDetails(null);
    setPackets([]);
    setCurrentPacket('');
  };

  const handleReturnLot = () => {
    if (!returningLotId || !operator || !pcsReturned) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an operator and enter PCS returned.' });
      return;
    }
    const pcs = parseInt(pcsReturned, 10);
    if (isNaN(pcs) || pcs <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid number of pieces.' });
      return;
    }
    
    const totalAmount = pcs * priceMaster.fourPTeching;

    const updatedLots = fourPTechingLots.map(lot =>
      lot.id === returningLotId
        ? {
            ...lot,
            isReturned: true,
            returnedBy: operator,
            returnDate: new Date().toISOString(),
            pcsReturned: pcs,
            totalAmount,
          }
        : lot
    );
    setFourPTechingLots(updatedLots);
    toast({ title: `Lot Returned`, description: `Total amount: ₹${totalAmount.toFixed(2)}` });

    // Reset return state
    setReturningLotId(null);
    setOperator('');
    setPcsReturned('');
  };

  const unreturnedLots = fourPTechingLots.filter(lot => !lot.isReturned);
  const returnedLots = fourPTechingLots.filter(lot => lot.isReturned).sort((a,b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime());

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="4P Teching Entry & Return" description="Manage 4P Teching lot creation and returns." />

      {!lotDetails ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Scan Lot Barcode</CardTitle>
            <CardDescription>Scan a barcode to begin creating a new 4P Teching lot.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBarcodeScan} className="flex gap-2 max-w-sm">
              <Input
                placeholder="Scan barcode (e.g., 61-B-1057)"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
              />
              <Button type="submit">
                <Barcode className="mr-2 h-4 w-4" /> Scan
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Add Packets to Lot</CardTitle>
            <CardDescription>
              Kapan: <span className="font-bold">{lotDetails.kapan}</span>, Lot: <span className="font-bold">{lotDetails.lot}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 max-w-sm mb-4">
              <Input
                ref={packetInputRef}
                placeholder="Enter packet number"
                value={currentPacket}
                onChange={e => setCurrentPacket(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPacket(); } }}
              />
              <Button onClick={handleAddPacket}>Add Packet</Button>
            </div>
            <div className="border rounded-md mb-4">
                <Table>
                    <TableHeader><TableRow><TableHead>Packet Number</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {packets.map((p, i) => (
                            <TableRow key={i}><TableCell>{p}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeletePacket(i)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>
                        ))}
                         {packets.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No packets added yet.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSaveLot}>Save Lot</Button>
                <Button variant="outline" onClick={() => setLotDetails(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Unreturned 4P Teching Lots</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Packets</TableHead><TableHead>Entry Date</TableHead><TableHead>Return Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {unreturnedLots.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell>{lot.packets.join(', ')}</TableCell>
                    <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                    <TableCell>
                      {returningLotId === lot.id ? (
                        <div className="flex gap-2 items-end">
                            <div className="w-[150px]">
                                <Label>Operator</Label>
                                <Select onValueChange={setOperator} value={operator}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{fourPTechingOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="w-[120px]">
                                <Label>PCS Returned</Label>
                                <Input value={pcsReturned} onChange={e => setPcsReturned(e.target.value)} type="number" placeholder="e.g., 150"/>
                            </div>
                            <Button onClick={handleReturnLot}>Confirm</Button>
                            <Button variant="ghost" onClick={() => setReturningLotId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button onClick={() => setReturningLotId(lot.id)}>Return</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {unreturnedLots.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">All lots have been returned.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader><CardTitle>Recently Returned Lots</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Returned By</TableHead><TableHead>PCS</TableHead><TableHead>Amount (₹)</TableHead><TableHead>Return Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {returnedLots.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell>{lot.returnedBy}</TableCell>
                    <TableCell>{lot.pcsReturned}</TableCell>
                    <TableCell>{lot.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell>{lot.returnDate ? format(new Date(lot.returnDate), 'PPp') : 'N/A'}</TableCell>
                  </TableRow>
                ))}
                 {returnedLots.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No lots returned yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

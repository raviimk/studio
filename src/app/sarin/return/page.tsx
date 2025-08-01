
'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY, RETURN_SCAN_SETTINGS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator, ScannedPacket, ReturnScanSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Check, ThumbsUp, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export default function ReturnSarinLotPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [scanSettings] = useLocalStorage<ReturnScanSettings>(RETURN_SCAN_SETTINGS_KEY, { sarin: true, laser: true });
  const { toast } = useToast();

  const [returningOperator, setReturningOperator] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for verification dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<SarinPacket | null>(null);
  const [scannedInDialog, setScannedInDialog] = useState<Set<string>>(new Set());
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);


  const unreturnedEntries: SarinPacket[] = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return sarinPackets
      .filter(p => {
        if (p.isReturned) return false;
        if (!searchTerm) return true;
        return p.lotNumber.toLowerCase().includes(searchLower) ||
               p.kapanNumber.toLowerCase().includes(searchLower) ||
               p.operator.toLowerCase().includes(searchLower);
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets, searchTerm]);
  
  const expectedPacketsForDialog = useMemo(() => {
    if (!selectedLot || !selectedLot.sarinMainPackets) return [];

    const mainPacketPrefixes = selectedLot.sarinMainPackets.map(p => p.fullBarcode);
    
    // This is a simplified generation. A real system might have more complex rules.
    let expected: {id: string, barcode: string}[] = [];
    for (const prefix of mainPacketPrefixes) {
      // Assuming sub-packets are just numbered suffixes.
      // This part might need adjustment based on real barcode generation logic.
      for (let i = 1; i <= (selectedLot.packetCount / mainPacketPrefixes.length); i++) {
        const barcode = `${prefix}-${i}`;
        expected.push({ id: uuidv4(), barcode });
      }
    }
    // This logic is flawed if packetCount is not a multiple of main packets.
    // Let's assume for now that scanned packets are what matter.
    // The prompt implies a different logic: if main packet is R85-115-A, valid returns can be R85-115-A1, A2 etc.
    // This means we need to check prefixes.
    
    // The UI will just show a list of what to scan. The validation is the key.
    return Array.from({ length: selectedLot.packetCount }).map((_, i) => ({
      id: uuidv4(),
      barcode: `Packet ${i + 1}`, // Placeholder text
    }));

  }, [selectedLot]);


  const handleOpenDialog = (lot: SarinPacket) => {
    if (!returningOperator) {
        toast({ variant: 'destructive', title: 'Operator Not Selected', description: 'Please select the operator who is returning the lot.' });
        return;
    }
    if (lot.operator !== returningOperator) {
        toast({ variant: 'destructive', title: 'Operator Mismatch', description: `This lot belongs to ${lot.operator}, not ${returningOperator}.` });
        return;
    }
    setSelectedLot(lot);
    setScannedInDialog(new Set());
    setScanInput('');
    setLastScanned(null);
    itemRefs.current.clear();
    setIsDialogOpen(true);
  };
  
   const handleDialogScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput || !selectedLot || !selectedLot.sarinMainPackets) return;

    const mainPacketPrefixes = selectedLot.sarinMainPackets.map(p => p.fullBarcode);
    const isValid = mainPacketPrefixes.some(prefix => scanInput.startsWith(prefix));

    if (isValid) {
        if(scannedInDialog.has(scanInput)){
            toast({variant: 'destructive', title: 'Already Scanned', description: 'This packet has already been verified for this lot.'})
        } else {
            setScannedInDialog(prev => new Set(prev).add(scanInput));
            setLastScanned(scanInput);
            toast({title: 'Packet Verified', description: scanInput});
        }
    } else {
        toast({ variant: 'destructive', title: 'Incorrect Packet', description: 'This packet does not belong to the selected lot.'});
    }
    setScanInput('');
  };
  
  const allPacketsScanned = useMemo(() => {
    if (!selectedLot) return false;
    return selectedLot.packetCount === scannedInDialog.size;
  }, [selectedLot, scannedInDialog]);
  
  const handleConfirmReturn = () => {
    if (!selectedLot || !returningOperator || !allPacketsScanned) return;

    const scannedReturnPackets: ScannedPacket[] = [...scannedInDialog].map(barcode => {
        const match = barcode.match(/^(?:R)?(\d+)-(\d+)(?:-(.+))?$/);
        const [, kapanNumber, packetNumber, suffix] = match || [];
        return {
            id: uuidv4(),
            fullBarcode: barcode,
            kapanNumber,
            packetNumber,
            suffix: suffix || ''
        }
    });

    const updatedPackets = sarinPackets.map(p =>
      p.id === selectedLot.id ? { ...p, isReturned: true, returnedBy: returningOperator, returnDate: new Date().toISOString(), scannedReturnPackets } : p
    );
    setSarinPackets(updatedPackets);
    toast({ title: 'Success', description: `Lot ${selectedLot.lotNumber} has been marked as returned.` });
    
    // Close dialog and reset state
    setIsDialogOpen(false);
    setSelectedLot(null);
    setScannedInDialog(new Set());
  };

  useEffect(() => {
    if (allPacketsScanned) {
      setShowVictoryAnimation(true);
      const timer = setTimeout(() => setShowVictoryAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [allPacketsScanned]);


  const handleLegacyReturn = (packetId: string) => {
    if (!returningOperator) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select who is returning the lot.' });
        return;
    }
    const packetToReturn = sarinPackets.find(p => p.id === packetId);

    if (window.confirm(`Are you sure you want to return Lot ${packetToReturn?.lotNumber} (Kapan: ${packetToReturn?.kapanNumber})?`)) {
      const updatedPackets = sarinPackets.map(p =>
        p.id === packetId ? { ...p, isReturned: true, returnedBy: returningOperator, returnDate: new Date().toISOString() } : p
      );
      setSarinPackets(updatedPackets);
      toast({ title: 'Success', description: `Lot entry has been marked as returned.` });
    }
  };

  if (!scanSettings.sarin) {
     return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <PageHeader title="Return Sarin Lot" description="Mark Sarin lots as returned." />
            <Card>
                <CardHeader>
                    <CardTitle>Unreturned Entries</CardTitle>
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search by Lot, Kapan, or Operator..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Select onValueChange={setReturningOperator} value={returningOperator}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select Returning Operator" />
                            </SelectTrigger>
                            <SelectContent>
                                {sarinOperators.map(op => (
                                <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lot</TableHead>
                            <TableHead>Kapan</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>M / P / J</TableHead>
                            <TableHead>Entry Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {unreturnedEntries.map(entry => (
                        <TableRow key={entry.id}>
                        <TableCell>{entry.lotNumber}</TableCell>
                        <TableCell>{entry.kapanNumber}</TableCell>
                        <TableCell>{entry.operator}</TableCell>
                        <TableCell className="font-mono">{entry.mainPacketNumber} / {entry.packetCount} / {entry.jiramCount || 0}</TableCell>
                        <TableCell>{format(new Date(entry.date), 'PPp')}</TableCell>
                        <TableCell>
                            <Button onClick={() => handleLegacyReturn(entry.id)} disabled={!returningOperator || returningOperator !== entry.operator}>
                                Return Entry
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                {unreturnedEntries.length === 0 && <p className="text-center text-muted-foreground p-4">No unreturned entries found.</p>}
                </CardContent>
            </Card>
        </div>
    )
  }

  // Scanning UI
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
        {showVictoryAnimation && <div className="fixed bottom-8 left-8 z-[100] animate-thumbs-up"><ThumbsUp className="h-24 w-24 text-green-500" fill="currentColor" /></div>}
        <PageHeader title="Return Sarin Lot (Scan Mode)" description="Verify all packets for a lot before marking it as returned." />
        <Card>
          <CardHeader>
              <CardTitle>Unreturned Lots</CardTitle>
               <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
                  <Select onValueChange={setReturningOperator} value={returningOperator}>
                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Returning Operator" /></SelectTrigger>
                    <SelectContent>{sarinOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                        <TableHead>Lot</TableHead>
                        <TableHead>Kapan</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>M / P / J</TableHead>
                        <TableHead>Entry Time</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {unreturnedEntries.map(lot => (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.lotNumber}</TableCell>
                      <TableCell>{lot.kapanNumber}</TableCell>
                      <TableCell>{lot.operator}</TableCell>
                      <TableCell className="font-mono">{lot.mainPacketNumber} / {lot.packetCount} / {lot.jiramCount || 0}</TableCell>
                      <TableCell>{format(new Date(lot.date), 'PPp')}</TableCell>
                      <TableCell><Button onClick={() => handleOpenDialog(lot)} disabled={!returningOperator || lot.operator !== returningOperator}>Verify & Return</Button></TableCell>
                    </TableRow>
                  ))}
                  {unreturnedEntries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground h-24">No unreturned lots found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Verify Sarin Lot: {selectedLot?.lotNumber}</DialogTitle>
                  <DialogDescription>Scan all {selectedLot?.packetCount} packets to complete the return. Returned by <span className="font-semibold">{returningOperator}</span>.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <form onSubmit={handleDialogScan}><Input placeholder="Scan packet barcode..." value={scanInput} onChange={e => setScanInput(e.target.value)} autoFocus disabled={allPacketsScanned} /></form>
                   <div className="mt-4"><Progress value={(scannedInDialog.size / (selectedLot?.packetCount || 1)) * 100} /><p className="text-sm text-center mt-2 text-muted-foreground">Verified: {scannedInDialog.size} / {selectedLot?.packetCount}</p></div>
                </div>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                   <Table>
                       <TableHeader><TableRow><TableHead>Scanned Packet</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                       <TableBody>
                           {[...scannedInDialog].map(barcode => (
                               <TableRow key={barcode} className="bg-green-100 dark:bg-green-900/30">
                                   <TableCell className="font-mono">{barcode}</TableCell>
                                   <TableCell><Check className="h-5 w-5 text-green-500" /></TableCell>
                               </TableRow>
                           ))}
                       </TableBody>
                   </Table>
                </div>
              </div>
              <div className="flex justify-end mt-4"><Button onClick={handleConfirmReturn} disabled={!allPacketsScanned}>Confirm Return</Button></div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

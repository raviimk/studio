
'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, SARIN_OPERATORS_KEY, RETURN_SCAN_SETTINGS_KEY } from '@/lib/constants';
import { SarinPacket, SarinOperator, ScannedPacket, ReturnScanSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Check, ThumbsUp, Trash2, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Normalizes a barcode for Sarin return matching by removing the 'R' prefix and any letter suffix.
// e.g., "R94-112-A" -> "94-112", "94-112" -> "94-112"
const normalizeBarcodeForSarin = (barcode: string): string => {
    let normalized = barcode.trim().toUpperCase();
    if (normalized.startsWith('R')) {
        normalized = normalized.substring(1);
    }
    // This regex removes a suffix like "-A", "-B", etc.
    return normalized.replace(/-[A-Z]$/, '');
};


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
  const [lastScanned, setLastScanned] = useState<{barcode: string, isValid: boolean} | null>(null);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(new Date());


  const scanInputRef = useRef<HTMLInputElement>(null);
  const lastScannedRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (lastScannedRef.current) {
        lastScannedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [lastScanned]);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);



  const unreturnedEntries: SarinPacket[] = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return sarinPackets
      .filter(p => {
        if (p.isReturned) return false;
        
        const operatorMatch = !returningOperator || p.operator === returningOperator;

        const searchMatch = !searchTerm ||
               p.lotNumber.toLowerCase().includes(searchLower) ||
               p.kapanNumber.toLowerCase().includes(searchLower) ||
               p.operator.toLowerCase().includes(searchLower);

        return operatorMatch && searchMatch;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets, searchTerm, returningOperator]);

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
    // Initialize with already scanned packets from a previous partial return/scan session
    const previouslyScanned = new Set(lot.scannedReturnPackets?.map(p => p.fullBarcode) || []);
    setScannedInDialog(previouslyScanned);
    setScanInput('');
    setLastScanned(null);
    setIsDialogOpen(true);
  };
  
   const expectedPacketsForLot = useMemo(() => {
    if (!selectedLot) return [];
    const mainPackets = selectedLot.sarinMainPackets?.map(p => p.fullBarcode) || [];
    
    // Logic to generate 'plus' packets, assuming main packet is like 'R1-965-A'
    const plusPackets: string[] = [];
    const mainPacket = selectedLot.sarinMainPackets?.[0];
    if (mainPacket && (selectedLot.jiramCount || 0) > 0) {
        const base = `R${mainPacket.kapanNumber}-${mainPacket.packetNumber}`;
        const mainPacketSuffixCode = 'A'.charCodeAt(0);
        
        for (let i = 0; i < (selectedLot.jiramCount || 0); i++) {
            const suffix = String.fromCharCode(mainPacketSuffixCode + mainPackets.length + i);
            plusPackets.push(`${base}-${suffix}`);
        }
    }
    
    // For older lots, we might need a fallback. Let's assume packetCount is total required.
    if (mainPackets.length === 0 && selectedLot.packetCount > 0) {
        return Array.from({ length: selectedLot.packetCount }, (_, i) => `Packet ${i + 1}`);
    }

    return [...mainPackets, ...plusPackets];
   }, [selectedLot]);


   const handleDialogScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput || !selectedLot) return;

    if (scannedInDialog.has(scanInput)) {
        toast({ variant: 'destructive', title: 'Already Scanned', description: 'This packet has already been verified for this lot.' });
        setScanInput('');
        return;
    }
    
    const isValid = expectedPacketsForLot.includes(scanInput);

    if (isValid) {
        const newScannedSet = new Set(scannedInDialog).add(scanInput);
        setScannedInDialog(newScannedSet);
        
        // Immediately persist the scan
        const scannedReturnPackets: ScannedPacket[] = [...newScannedSet].map(barcode => {
            const match = barcode.match(/^(?:R)?(\d+)-(\d+)(?:-(.+))?$/);
            const [, kapanNumber, packetNumber, suffix] = match || [];
            return { id: uuidv4(), fullBarcode: barcode, kapanNumber, packetNumber, suffix: suffix || '' };
        });
        setSarinPackets(prev => prev.map(p => p.id === selectedLot.id ? { ...p, scannedReturnPackets } : p));
        
        setLastScanned({ barcode: scanInput, isValid: true });
        toast({ title: 'Packet Verified & Saved', description: scanInput });
    } else {
        setLastScanned({ barcode: scanInput, isValid: false });
        setShake(true);
        setTimeout(() => setShake(false), 820);
        toast({ 
            variant: 'destructive', 
            title: 'Incorrect Packet', 
            description: `Packet ${scanInput} does not belong to this lot.`
        });
    }
    setScanInput('');
  };
  
  const allPacketsScanned = useMemo(() => {
    if (!selectedLot) return false;
    // For lots created before scanning was mandatory
    if (expectedPacketsForLot.length === 0) return true;
    
    return expectedPacketsForLot.length === scannedInDialog.size;
  }, [selectedLot, scannedInDialog, expectedPacketsForLot]);
  
  const handleConfirmReturn = useCallback(() => {
    if (!selectedLot || !returningOperator) return;

    if (!allPacketsScanned) {
        toast({ variant: 'destructive', title: 'Scan Incomplete', description: `Please scan all ${expectedPacketsForLot.length} required packets.`});
        return;
    }

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
    
    setIsDialogOpen(false);
    setSelectedLot(null);
    setScannedInDialog(new Set());
    setReturningOperator('');
  }, [selectedLot, returningOperator, scannedInDialog, sarinPackets, setSarinPackets, toast, allPacketsScanned, expectedPacketsForLot.length]);

  useEffect(() => {
    if (allPacketsScanned) {
      setShowVictoryAnimation(true);
      const victoryTimer = setTimeout(() => setShowVictoryAnimation(false), 2000);
      
      const returnTimer = setTimeout(handleConfirmReturn, 1000);

      return () => {
        clearTimeout(victoryTimer);
        clearTimeout(returnTimer);
      };
    }
  }, [allPacketsScanned, handleConfirmReturn]);


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
      setReturningOperator('');
    }
  };

  const handleRemoveFromScan = (barcodeToRemove: string) => {
    const newScannedSet = new Set(scannedInDialog);
    newScannedSet.delete(barcodeToRemove);
    setScannedInDialog(newScannedSet);

    if (selectedLot) {
        const scannedReturnPackets: ScannedPacket[] = [...newScannedSet].map(barcode => {
            const match = barcode.match(/^(?:R)?(\d+)-(\d+)(?:-(.+))?$/);
            const [, kapanNumber, packetNumber, suffix] = match || [];
            return { id: uuidv4(), fullBarcode: barcode, kapanNumber, packetNumber, suffix: suffix || '' };
        });
        setSarinPackets(prev => prev.map(p => p.id === selectedLot.id ? { ...p, scannedReturnPackets } : p));
        toast({title: "Scan Removed", description: `Removed ${barcodeToRemove} from the lot.`});
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
                    <div className="overflow-x-auto">
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
                            {unreturnedEntries.map(entry => {
                                const timeDiff = differenceInMinutes(now, parseISO(entry.date));
                                const isOverdue = timeDiff > 10;
                                return (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.lotNumber}</TableCell>
                                    <TableCell>{entry.kapanNumber}</TableCell>
                                    <TableCell>{entry.operator}</TableCell>
                                    <TableCell className="font-mono">{entry.mainPacketNumber} / {entry.packetCount} / {entry.jiramCount || 0}</TableCell>
                                    <TableCell>{format(new Date(entry.date), 'PPp')}</TableCell>
                                    <TableCell>
                                        <Button 
                                        onClick={() => handleLegacyReturn(entry.id)} 
                                        disabled={!returningOperator || returningOperator !== entry.operator}
                                        variant={isOverdue ? 'destructive' : 'default'}
                                        className={cn(isOverdue && 'animate-pulse')}
                                        >
                                            Return Entry
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                            </TableBody>
                        </Table>
                    </div>
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
                  {unreturnedEntries.map(lot => {
                    const timeDiff = differenceInMinutes(now, parseISO(lot.date));
                    const isOverdue = timeDiff > 10;
                    return (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.lotNumber}</TableCell>
                      <TableCell>{lot.kapanNumber}</TableCell>
                      <TableCell>{lot.operator}</TableCell>
                      <TableCell className="font-mono">{lot.mainPacketNumber} / {lot.packetCount} / {lot.jiramCount || 0}</TableCell>
                      <TableCell>{format(new Date(lot.date), 'PPp')}</TableCell>
                      <TableCell>
                          <Button 
                            onClick={() => handleOpenDialog(lot)} 
                            disabled={!returningOperator || lot.operator !== returningOperator}
                            variant={isOverdue ? 'destructive' : 'default'}
                            className={cn(isOverdue && 'animate-pulse')}
                          >
                            Verify & Return
                          </Button>
                      </TableCell>
                    </TableRow>
                  )})}
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
                  <DialogDescription>Scan all {expectedPacketsForLot.length} required packets to complete the return. Returned by <span className="font-semibold">{returningOperator}</span>.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <form onSubmit={handleDialogScan}><Input ref={scanInputRef} placeholder="Scan packet barcode..." value={scanInput} onChange={e => setScanInput(e.target.value)} autoFocus disabled={allPacketsScanned} className={cn(shake && 'animate-shake')} /></form>
                   <div className="mt-4"><Progress value={(scannedInDialog.size / (expectedPacketsForLot.length || 1)) * 100} /><p className="text-sm text-center mt-2 text-muted-foreground">Verified: {scannedInDialog.size} / {expectedPacketsForLot.length}</p></div>
                </div>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                   <Table>
                       <TableHeader><TableRow><TableHead>Expected Packet</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                       <TableBody>
                           {expectedPacketsForLot.map(barcode => (
                               <TableRow key={barcode} ref={lastScanned?.barcode === barcode ? lastScannedRef : null} className={cn(scannedInDialog.has(barcode) && "bg-green-100 dark:bg-green-900/30")}>
                                   <TableCell className="font-mono">{barcode}</TableCell>
                                   <TableCell>
                                    {scannedInDialog.has(barcode) ? 
                                        <Check className="h-5 w-5 text-green-500" /> : 
                                        <X className="h-5 w-5 text-destructive" />}
                                   </TableCell>
                                    <TableCell>
                                        {scannedInDialog.has(barcode) && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFromScan(barcode)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                   </TableCell>
                               </TableRow>
                           ))}
                       </TableBody>
                   </Table>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                  <Button onClick={handleConfirmReturn} disabled={!allPacketsScanned}>
                    Confirm Return
                  </Button>
              </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

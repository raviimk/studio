
'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_OPERATORS_KEY, RETURN_SCAN_SETTINGS_KEY } from '@/lib/constants';
import { LaserLot, LaserOperator, ScannedPacket, ReturnScanSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';


export default function ReturnLaserLotPage() {
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [scanSettings] = useLocalStorage<ReturnScanSettings>(RETURN_SCAN_SETTINGS_KEY, { sarin: true, laser: true });

  const [returningOperator, setReturningOperator] = useState('');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // State for the verification dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<LaserLot | null>(null);
  const [scannedInDialog, setScannedInDialog] = useState<Set<string>>(new Set());
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [subPacketCount, setSubPacketCount] = useState<number | string>(0);
  const subPacketInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (lastScanned && itemRefs.current.has(lastScanned)) {
        const item = itemRefs.current.get(lastScanned);
        item?.scrollIntoView({ behavior: 'smooth', block: 'nearest'});
    }
  }, [lastScanned, scannedInDialog]);

  const unreturnedLots = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return laserLots.filter(lot => {
        if (lot.isReturned) return false;
        
        if (!searchTerm) return true;
        
        return lot.lotNumber.toLowerCase().includes(searchLower) ||
               lot.kapanNumber.toLowerCase().includes(searchLower) ||
               lot.tensionType.toLowerCase().includes(searchLower);
    }).sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [laserLots, searchTerm]);

  const handleOpenDialog = (lot: LaserLot) => {
    if (!returningOperator) {
        toast({ variant: 'destructive', title: 'Operator Not Selected', description: 'Please select the operator who is returning the lot.' });
        return;
    }
    setSelectedLot(lot);
    setScannedInDialog(new Set());
    setScanInput('');
    setLastScanned(null);
    setSubPacketCount(0);
    itemRefs.current.clear();
    setIsDialogOpen(true);
  };
  
  const handleDialogScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput || !selectedLot) return;
    
    const expectedBarcodes = selectedLot.scannedPackets?.map(p => p.fullBarcode) || [];
    if (expectedBarcodes.includes(scanInput)) {
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
  
  const handleReturnLot = useCallback(() => {
    if (!selectedLot || !returningOperator) return;

    const numSubPackets = typeof subPacketCount === 'string' ? parseInt(subPacketCount, 10) : subPacketCount;
    if (isNaN(numSubPackets) || numSubPackets < 0) {
        toast({ variant: 'destructive', title: 'Invalid Sub Packet Count', description: 'Please enter a valid number for sub packets.'});
        return;
    }

    const updatedLots = laserLots.map(lot =>
      lot.id === selectedLot.id
        ? { ...lot, isReturned: true, returnedBy: returningOperator, returnDate: new Date().toISOString(), subPacketCount: numSubPackets }
        : lot
    );
    setLaserLots(updatedLots);
    toast({ title: 'Success', description: `Lot ${selectedLot.lotNumber} has been marked as returned.` });
    
    // Close dialog and reset state
    setIsDialogOpen(false);
    setSelectedLot(null);
    setScannedInDialog(new Set());
    setSubPacketCount(0);
  }, [laserLots, returningOperator, selectedLot, setLaserLots, subPacketCount, toast]);
  
   const handleLegacyReturn = (lotId: string) => {
    if (!returningOperator) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select who is returning the lot.' });
        return;
    }
    const lotToReturn = laserLots.find(l => l.id === lotId);
    if (window.confirm(`Are you sure you want to return Lot ${lotToReturn?.lotNumber}?`)) {
      const updatedLots = laserLots.map(l =>
        l.id === lotId ? { ...l, isReturned: true, returnedBy: returningOperator, returnDate: new Date().toISOString() } : l
      );
      setLaserLots(updatedLots);
      toast({ title: 'Success', description: 'Lot entry has been marked as returned.' });
    }
  };

  const allPacketsScanned = useMemo(() => {
    if (!selectedLot) return false;
    // For lots created before scanning was mandatory
    if (!selectedLot.scannedPackets || selectedLot.scannedPackets.length === 0) {
        return true;
    }
    return selectedLot.packetCount === scannedInDialog.size;
  }, [selectedLot, scannedInDialog]);
  
  useEffect(() => {
    if (allPacketsScanned) {
        setShowVictoryAnimation(true);
        const victoryTimer = setTimeout(() => setShowVictoryAnimation(false), 2000);
        
        return () => {
            clearTimeout(victoryTimer);
        };
    }
}, [allPacketsScanned, handleReturnLot]);

  const isConfirmDisabled = useMemo(() => {
    if (!allPacketsScanned) return true;
    const numSubPackets = parseInt(String(subPacketCount), 10);
    return isNaN(numSubPackets) || numSubPackets < 0;
  }, [allPacketsScanned, subPacketCount]);
  
  if (!scanSettings.laser) {
      return (
         <div className="container mx-auto py-8 px-4 md:px-6">
            <PageHeader title="Return Laser Lot" description="Mark Laser lots as returned." />
             <Card>
                <CardHeader>
                    <CardTitle>Unreturned Lots</CardTitle>
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
                        <Select onValueChange={setReturningOperator} value={returningOperator}>
                            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Returning Operator" /></SelectTrigger>
                            <SelectContent>{laserOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Lot</TableHead><TableHead>Kapan</TableHead><TableHead>Packets</TableHead><TableHead>Entry Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {unreturnedLots.map(lot => (
                                <TableRow key={lot.id}>
                                <TableCell>{lot.lotNumber}</TableCell><TableCell>{lot.kapanNumber}</TableCell><TableCell>{lot.packetCount}</TableCell>
                                <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                                <TableCell><Button onClick={() => handleLegacyReturn(lot.id)} disabled={!returningOperator}>Return</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      )
  }


  return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        {showVictoryAnimation && (
          <div className="fixed bottom-8 left-8 z-[100] animate-thumbs-up">
            <ThumbsUp className="h-24 w-24 text-green-500" fill="currentColor" />
          </div>
        )}
        <PageHeader title="Return Laser Lot (Scan Mode)" description="Verify all packets for a lot before marking it as returned." />
        <Card>
          <CardHeader>
              <CardTitle>Unreturned Lots</CardTitle>
               <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <Input
                      placeholder="Search by Lot, Kapan, or Tension..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                  />
                  <Select onValueChange={setReturningOperator} value={returningOperator}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select Returning Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {laserOperators.map(op => (
                        <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Lot No.</TableHead>
                    <TableHead>Kapan No.</TableHead>
                    <TableHead>Tension</TableHead>
                    <TableHead>Packets</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unreturnedLots.map(lot => (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.lotNumber}</TableCell>
                      <TableCell>{lot.kapanNumber}</TableCell>
                      <TableCell>{lot.tensionType}</TableCell>
                      <TableCell>{lot.packetCount}</TableCell>
                      <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleOpenDialog(lot)} disabled={!returningOperator}>
                            Verify & Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {unreturnedLots.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                            No unreturned lots found.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Verify Lot: {selectedLot?.lotNumber}</DialogTitle>
                  <DialogDescription>
                      Scan all {selectedLot?.packetCount} packets to complete the return process. Returned by <span className="font-semibold">{returningOperator}</span>.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <form onSubmit={handleDialogScan} className="flex flex-col gap-2">
                       <Input 
                           placeholder="Scan packet barcode..."
                           value={scanInput}
                           onChange={e => setScanInput(e.target.value)}
                           autoFocus
                           disabled={allPacketsScanned}
                        />
                       <Button type="submit" disabled={allPacketsScanned}>Scan Packet</Button>
                   </form>
                   <div className="mt-4">
                       <Progress value={(scannedInDialog.size / (selectedLot?.packetCount || 1)) * 100} />
                       <p className="text-sm text-center mt-2 text-muted-foreground">
                           Verified: {scannedInDialog.size} / {selectedLot?.packetCount || 0}
                       </p>
                   </div>
                   {allPacketsScanned && (
                     <div className="mt-4 space-y-2 animate-in fade-in-50">
                        <label htmlFor="sub-packets" className="font-medium">Total Sub Packets</label>
                        <Input
                          id="sub-packets"
                          ref={subPacketInputRef}
                          type="number"
                          placeholder="Enter count of sub-packets..."
                          value={subPacketCount}
                          onChange={(e) => setSubPacketCount(e.target.value ? parseInt(e.target.value) : 0)}
                        />
                     </div>
                   )}
                </div>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                   <Table>
                       <TableHeader>
                           <TableRow>
                               <TableHead>Expected Packet</TableHead>
                               <TableHead>Status</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {selectedLot?.scannedPackets?.map(packet => (
                               <TableRow key={packet.id} ref={node => {
                                   if(node) itemRefs.current.set(packet.fullBarcode, node);
                                   else itemRefs.current.delete(packet.fullBarcode);
                               }} className={cn(lastScanned === packet.fullBarcode && 'bg-green-100 dark:bg-green-900/30')}>
                                   <TableCell className="font-mono">{packet.fullBarcode}</TableCell>
                                   <TableCell>
                                       {scannedInDialog.has(packet.fullBarcode) ? 
                                         <Check className="h-5 w-5 text-green-500" /> : 
                                         <X className="h-5 w-5 text-destructive" />}
                                   </TableCell>
                               </TableRow>
                           ))}
                       </TableBody>
                   </Table>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                  <Button onClick={handleReturnLot} disabled={isConfirmDisabled}>
                      Confirm Return
                  </Button>
              </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}

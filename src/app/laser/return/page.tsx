'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_OPERATORS_KEY } from '@/lib/constants';
import { LaserLot, LaserOperator, ScannedPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Barcode, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReturnLaserLotPage() {
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [selectedOperators, setSelectedOperators] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  // State for the return verification dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<LaserLot | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [verifiedPackets, setVerifiedPackets] = useState<Set<string>>(new Set());
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDialogOpen) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isDialogOpen]);
  
  const handleOpenReturnDialog = (lotId: string) => {
    const operatorName = selectedOperators[lotId];
    if (!operatorName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an operator.' });
      return;
    }
    const lotToReturn = laserLots.find(lot => lot.id === lotId);
    if (lotToReturn) {
      setSelectedLot(lotToReturn);
      setVerifiedPackets(new Set());
      setScannedBarcode('');
      setIsDialogOpen(true);
    }
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBarcode || !selectedLot) return;
    
    const targetPacket = selectedLot.scannedPackets?.find(p => p.fullBarcode === scannedBarcode);

    if (targetPacket) {
      if(verifiedPackets.has(targetPacket.id)) {
        toast({ variant: 'destructive', title: 'Already Verified', description: 'This packet has already been scanned.' });
      } else {
        const newVerified = new Set(verifiedPackets);
        newVerified.add(targetPacket.id);
        setVerifiedPackets(newVerified);
        toast({ title: 'Packet Verified', description: `Packet ${targetPacket.fullBarcode} confirmed.`});
      }
    } else {
        toast({ variant: 'destructive', title: 'Wrong Packet', description: 'This packet does not belong to the current lot.' });
    }
    setScannedBarcode('');
  };

  const handleConfirmReturn = () => {
    if (!selectedLot) return;

    const operatorName = selectedOperators[selectedLot.id];

    const updatedLots = laserLots.map(lot =>
      lot.id === selectedLot.id
        ? { ...lot, isReturned: true, returnedBy: operatorName, returnDate: new Date().toISOString() }
        : lot
    );
    setLaserLots(updatedLots);
    toast({ title: 'Success', description: 'Lot has been marked as returned.' });
    
    // Close dialog and reset state
    setIsDialogOpen(false);
    setSelectedLot(null);
  };
  
  const allPacketsVerified = useMemo(() => {
    if (!selectedLot || !selectedLot.scannedPackets) return false;
    return verifiedPackets.size === selectedLot.scannedPackets.length;
  }, [selectedLot, verifiedPackets]);

  const unreturnedLots = laserLots.filter(lot => !lot.isReturned);

  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <PageHeader title="Return Laser Lot" description="Mark laser lots as returned after packet verification." />
        <Card>
          <CardHeader><CardTitle>Unreturned Lots</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot No.</TableHead>
                  <TableHead>Kapan No.</TableHead>
                  <TableHead>Tension</TableHead>
                  <TableHead>Packets</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Select Operator</TableHead>
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
                      <Select onValueChange={(value) => setSelectedOperators(prev => ({ ...prev, [lot.id]: value }))}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {laserOperators.map(op => (
                            <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => handleOpenReturnDialog(lot.id)} disabled={!selectedOperators[lot.id]}>
                        Return Lot
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {unreturnedLots.length === 0 && <p className="text-center text-muted-foreground p-4">No unreturned lots found.</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Lot: {selectedLot?.lotNumber}</DialogTitle>
            <DialogDescription>
              Scan all packets to verify they are present before confirming the return.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <form onSubmit={handleBarcodeScan} className="flex gap-2">
                <Input
                    ref={barcodeInputRef}
                    placeholder="Scan packet barcode..."
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                />
                <Button type="submit" disabled={!scannedBarcode}>
                    <Barcode className="mr-2 h-4 w-4" /> Verify
                </Button>
            </form>

            <div className="border rounded-md max-h-[300px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Barcode</TableHead>
                            <TableHead>Packet #</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedLot?.scannedPackets?.map(p => (
                            <TableRow key={p.id} className={verifiedPackets.has(p.id) ? 'bg-green-100 dark:bg-green-900/30' : ''}>
                                <TableCell>
                                    {verifiedPackets.has(p.id) ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </TableCell>
                                <TableCell className="font-mono">{p.fullBarcode}</TableCell>
                                <TableCell>{p.packetNumber}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>

          <DialogFooter className='sm:justify-between items-center pt-4'>
            <Badge>
                Verified: {verifiedPackets.size} / {selectedLot?.scannedPackets?.length || 0}
            </Badge>
            <Button onClick={handleConfirmReturn} disabled={!allPacketsVerified}>
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

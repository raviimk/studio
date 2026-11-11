
'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY } from '@/lib/constants';
import { SarinPacket, ScannedPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Save, X, ScanLine, Check } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';


export default function RecentSarinEntriesPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const { toast } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SarinPacket>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [initialTotalPackets, setInitialTotalPackets] = useState(0);

  // State for the Rescan dialog
  const [isRescanOpen, setIsRescanOpen] = useState(false);
  const [lotToRescan, setLotToRescan] = useState<SarinPacket | null>(null);
  const [scannedInDialog, setScannedInDialog] = useState<Set<string>>(new Set());
  const [scanInput, setScanInput] = useState('');


  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setSarinPackets(sarinPackets.filter(p => p.id !== id));
      toast({ title: 'Success', description: 'Sarin packet entry deleted.' });
    }
  };

  const handleEdit = (packet: SarinPacket) => {
    setEditingId(packet.id);
    const total = (packet.packetCount || 0) + (packet.jiramCount || 0);
    setInitialTotalPackets(total);
    setEditFormData({
        mainPacketNumber: packet.mainPacketNumber,
        packetCount: packet.packetCount,
        jiramCount: packet.jiramCount
    });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    setInitialTotalPackets(0);
  };

  const handleSaveEdit = (id: string) => {
    setSarinPackets(prev => prev.map(p => {
        if (p.id === id) {
            return {
                ...p,
                mainPacketNumber: editFormData.mainPacketNumber ?? p.mainPacketNumber,
                packetCount: editFormData.packetCount ?? p.packetCount,
                jiramCount: editFormData.jiramCount ?? p.jiramCount
            };
        }
        return p;
    }));
    toast({ title: 'Success', description: 'Entry updated successfully.' });
    handleCancelEdit();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);

    setEditFormData(prev => {
        const newFormData = { ...prev };
        if (name === 'jiramCount') {
            const newJiram = value === '' ? 0 : numValue;
            if (!isNaN(newJiram) && newJiram >= 0) {
                 const newPacketCount = initialTotalPackets - newJiram;
                 newFormData.jiramCount = newJiram > 0 ? newJiram : undefined;
                 newFormData.packetCount = newPacketCount >= 0 ? newPacketCount : 0;
            }
        } else {
            newFormData[name as keyof SarinPacket] = isNaN(numValue) ? undefined : numValue;
        }
        return newFormData;
    });
  };

  const sortedPackets = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = sarinPackets.filter(p =>
      !searchLower || p.lotNumber.toLowerCase().includes(searchLower)
    );
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets, searchTerm]);

  const rescanPendingCount = useMemo(() => {
    return sarinPackets.filter(p => p.isReturned && (!p.scannedReturnPackets || p.scannedReturnPackets.length < p.packetCount)).length;
  }, [sarinPackets]);

  // Rescan Dialog Logic
  const handleOpenRescanDialog = (lot: SarinPacket) => {
    setLotToRescan(lot);
    // Initialize with already scanned packets
    const previouslyScanned = new Set(lot.scannedReturnPackets?.map(p => p.fullBarcode) || []);
    setScannedInDialog(previouslyScanned);
    setScanInput('');
    setIsRescanOpen(true);
  };

  const handleDialogScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput || !lotToRescan) return;
    
    if (scannedInDialog.has(scanInput)) {
        toast({variant: 'destructive', title: 'Already Scanned', description: 'This packet has already been verified for this lot.'})
    } else {
        setScannedInDialog(prev => new Set(prev).add(scanInput));
        toast({title: 'Packet Added', description: scanInput});
    }
    setScanInput('');
  };
  
  const handleRemoveFromScan = (barcode: string) => {
    setScannedInDialog(prev => {
        const newSet = new Set(prev);
        newSet.delete(barcode);
        return newSet;
    })
  }

  const allPacketsScannedForRescan = useMemo(() => {
    if (!lotToRescan) return false;
    return lotToRescan.packetCount === scannedInDialog.size;
  }, [lotToRescan, scannedInDialog]);
  
  const handleConfirmRescan = useCallback(() => {
    if (!lotToRescan) return;

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

    setSarinPackets(prev => prev.map(p => 
        p.id === lotToRescan.id ? { ...p, scannedReturnPackets } : p
    ));

    toast({ title: 'Success', description: `Scanned packets attached to Lot ${lotToRescan.lotNumber}.` });
    setIsRescanOpen(false);
    setLotToRescan(null);
  }, [lotToRescan, scannedInDialog, setSarinPackets, toast]);


  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <PageHeader title="Recent Sarin Entries" description="View, search, and edit all created Sarin packets." />
        <Card>
          <CardHeader>
            <CardTitle>All Sarin Packets</CardTitle>
            <div className="pt-4">
                <Input
                    placeholder="Search by Lot Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Kapan #</TableHead>
                    <TableHead>Main Packet Count</TableHead>
                    <TableHead>Packets</TableHead>
                    <TableHead>Jiram</TableHead>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                        <div className="flex flex-col">
                            Actions
                            {rescanPendingCount > 0 && (
                                <span className="text-xs font-normal text-yellow-600">({rescanPendingCount} Rescan Pending)</span>
                            )}
                        </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPackets.map(p => {
                    const needsRescan = p.isReturned && (!p.scannedReturnPackets || p.scannedReturnPackets.length < p.packetCount);
                    return (
                    <TableRow key={p.id}>
                      <TableCell>{p.operator}</TableCell>
                      <TableCell>{p.lotNumber}</TableCell>
                      <TableCell>{p.machine}</TableCell>
                      <TableCell>{p.kapanNumber}</TableCell>
                      <TableCell>
                        {editingId === p.id ? (
                          <Input type="number" name="mainPacketNumber" value={editFormData.mainPacketNumber || ''} onChange={handleInputChange} className="h-8 w-20" />
                        ) : (
                          p.mainPacketNumber
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === p.id ? (
                          <Input type="number" name="packetCount" value={editFormData.packetCount || ''} onChange={handleInputChange} className="h-8 w-20" />
                        ) : (
                          p.packetCount
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === p.id ? (
                          <Input type="number" name="jiramCount" value={editFormData.jiramCount || ''} onChange={handleInputChange} className="h-8 w-20" />
                        ) : (
                          p.jiramCount || 0
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(p.date), 'PPp')}</TableCell>
                      <TableCell>
                        <Badge variant={p.isReturned ? 'secondary' : 'destructive'}>
                          {p.isReturned ? 'Returned' : 'Not Returned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingId === p.id ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(p.id)}><Save className="h-4 w-4 text-green-600" /></Button>
                              <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4 text-red-600" /></Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} disabled={p.isReturned}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                              {needsRescan && (
                                <Button variant="outline" size="sm" onClick={() => handleOpenRescanDialog(p)}>
                                  <ScanLine className="mr-2 h-4 w-4" /> Rescan
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
              {sortedPackets.length === 0 && <p className="text-center text-muted-foreground p-4">No entries found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRescanOpen} onOpenChange={setIsRescanOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Rescan Packets for Lot: {lotToRescan?.lotNumber}</DialogTitle>
            <DialogDescription>
              Scan all {lotToRescan?.packetCount} packets for this returned lot to attach them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
              <form onSubmit={handleDialogScan} className="flex flex-col gap-2">
                <Input
                  placeholder="Scan packet barcode..."
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  autoFocus
                  disabled={allPacketsScannedForRescan}
                />
                <Button type="submit" disabled={allPacketsScannedForRescan}>Scan Packet</Button>
              </form>
              <div className="mt-4">
                <Progress value={(scannedInDialog.size / (lotToRescan?.packetCount || 1)) * 100} />
                <p className="text-sm text-center mt-2 text-muted-foreground">
                  Verified: {scannedInDialog.size} / {lotToRescan?.packetCount || 0}
                </p>
              </div>
            </div>
            <div className="border rounded-md max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Scanned Packet</TableHead><TableHead>Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {[...scannedInDialog].map(barcode => (
                    <TableRow key={barcode} className="bg-green-100 dark:bg-green-900/30">
                      <TableCell className="font-mono">{barcode}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFromScan(barcode)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleConfirmRescan} disabled={!lotToRescan}>
              <Check className="mr-2 h-4 w-4" /> Confirm & Attach Scans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

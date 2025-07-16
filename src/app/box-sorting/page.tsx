
'use client';
import React, { useState, useMemo, useRef, Fragment, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BOX_SORTING_RANGES_KEY, BOX_SORTING_PACKETS_KEY } from '@/lib/constants';
import { BoxSortingRange, BoxSortingPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, Box, Package, Scale, Trash2, Copy, Printer, Pencil } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


type ShapeSummary = {
  shape: string;
  totalPackets: number;
  totalRoughWeight: number;
  totalPolishWeight: number;
  boxes: Record<string, {
    count: number;
    roughWeight: number;
    polishWeight: number;
  }>;
};

type ViewingBox = {
    shape: string;
    boxLabel: string;
} | null;

type ManualEntry = {
    packetNumber: string;
    shape: string;
    roughWeight: string;
    polishWeight: string;
}

type HighlightedItem = {
    shape: string;
    boxLabel: string;
} | null;

export default function BoxSortingPage() {
  const { toast } = useToast();
  const [ranges] = useLocalStorage<BoxSortingRange[]>(BOX_SORTING_RANGES_KEY, []);
  const [packets, setPackets] = useLocalStorage<BoxSortingPacket[]>(BOX_SORTING_PACKETS_KEY, []);
  
  const [barcode, setBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [manualEntry, setManualEntry] = useState<ManualEntry>({
      packetNumber: '',
      shape: '',
      roughWeight: '',
      polishWeight: ''
  });

  const [viewingBox, setViewingBox] = useState<ViewingBox>(null);
  const [highlightedItem, setHighlightedItem] = useState<HighlightedItem>(null);

  useEffect(() => {
    if (highlightedItem) {
      const timer = setTimeout(() => {
        setHighlightedItem(null);
      }, 2000); // Highlight for 2 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightedItem]);
  
  const sortPacket = (packetData: Omit<BoxSortingPacket, 'id' | 'scanTime' | 'boxLabel'>) => {
    if (ranges.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Setup Required',
        description: 'Please define box sorting ranges in the Control Panel first.',
      });
      return false;
    }
    
    if (packets.some(p => p.packetNumber === packetData.packetNumber)) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Packet',
            description: `Packet ${packetData.packetNumber} has already been scanned.`,
        });
        return false;
    }

    const matchedRange = ranges.find(r => packetData.polishWeight >= r.from && packetData.polishWeight <= r.to);
    if (!matchedRange) {
        toast({
            variant: 'destructive',
            title: 'No Matching Box',
            description: `No box range configured for polish weight ${packetData.polishWeight}.`,
        });
        return false;
    }

    const newPacket: BoxSortingPacket = {
      id: uuidv4(),
      ...packetData,
      boxLabel: matchedRange.label,
      scanTime: new Date().toISOString(),
    };

    setPackets(prev => [...prev, newPacket]);
    setHighlightedItem({ shape: newPacket.shape, boxLabel: newPacket.boxLabel });
    toast({
        title: `Packet Added to ${newPacket.shape} / ${matchedRange.label}`,
        description: `Packet ${packetData.packetNumber} sorted successfully.`,
    });
    return true;
  }

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    const values = barcode.split(',');
    if (values.length < 15) {
      toast({
        variant: 'destructive',
        title: 'Invalid Barcode Format',
        description: `Expected 15 comma-separated values, but got ${values.length}.`,
      });
      return;
    }

    const roughWeight = parseFloat(values[7]);
    const polishWeight = parseFloat(values[8]);
    const shape = values[11]?.trim().toUpperCase();
    const packetNumber = values[14]?.trim();

    if (isNaN(roughWeight) || isNaN(polishWeight) || !shape || !packetNumber) {
        toast({
            variant: 'destructive',
            title: 'Parsing Error',
            description: 'Could not extract required fields (weights, shape, packet number) from the barcode.',
        });
        return;
    }

    if (sortPacket({ barcode, packetNumber, shape, roughWeight, polishWeight })) {
      setBarcode('');
      barcodeInputRef.current?.focus();
    }
  };
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { packetNumber, shape, roughWeight, polishWeight } = manualEntry;

    if (!packetNumber || !shape || !roughWeight || !polishWeight) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields for manual entry.' });
        return;
    }
    
    const parsedRoughWeight = parseFloat(roughWeight);
    const parsedPolishWeight = parseFloat(polishWeight);

    if (isNaN(parsedRoughWeight) || isNaN(parsedPolishWeight)) {
        toast({ variant: 'destructive', title: 'Invalid Weight', description: 'Rough and Polish weight must be valid numbers.' });
        return;
    }
    
    if(sortPacket({
        barcode: `manual-${packetNumber}`,
        packetNumber: packetNumber.trim(),
        shape: shape.trim().toUpperCase(),
        roughWeight: parsedRoughWeight,
        polishWeight: parsedPolishWeight
    })) {
        setManualEntry({ packetNumber: '', shape: '', roughWeight: '', polishWeight: '' });
    }
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setManualEntry(prev => ({...prev, [name]: value}));
  }

  const shapeSummary: ShapeSummary[] = useMemo(() => {
    const summary: Record<string, ShapeSummary> = {};
    packets.forEach(packet => {
        if (!summary[packet.shape]) {
            summary[packet.shape] = {
                shape: packet.shape,
                totalPackets: 0,
                totalRoughWeight: 0,
                totalPolishWeight: 0,
                boxes: {}
            };
        }
        const shapeGroup = summary[packet.shape];
        shapeGroup.totalPackets++;
        shapeGroup.totalRoughWeight += packet.roughWeight;
        shapeGroup.totalPolishWeight += packet.polishWeight;

        if (!shapeGroup.boxes[packet.boxLabel]) {
            shapeGroup.boxes[packet.boxLabel] = { count: 0, roughWeight: 0, polishWeight: 0 };
        }
        const boxGroup = shapeGroup.boxes[packet.boxLabel];
        boxGroup.count++;
        boxGroup.roughWeight += packet.roughWeight;
        boxGroup.polishWeight += packet.polishWeight;
    });
    return Object.values(summary).sort((a,b) => a.shape.localeCompare(b.shape));
  }, [packets]);

  const handleDeletePacket = (packetId: string) => {
    setPackets(prev => prev.filter(p => p.id !== packetId));
    toast({ title: 'Packet Deleted' });
  };

  const handleDeleteBox = (shape: string, boxLabel: string) => {
    setPackets(prev => prev.filter(p => !(p.shape === shape && p.boxLabel === boxLabel)));
    toast({ title: 'Box Cleared', description: `All packets from ${boxLabel} in ${shape} have been deleted.`});
  }

  const handleCopyToClipboard = (packetsToCopy: BoxSortingPacket[]) => {
    const csvHeader = "Packet Number,Rough Weight,Polish Weight,Shape,Box\n";
    const csvBody = packetsToCopy.map(p => `${p.packetNumber},${p.roughWeight},${p.polishWeight},${p.shape},${p.boxLabel}`).join('\n');
    navigator.clipboard.writeText(csvHeader + csvBody);
    toast({ title: 'Copied to Clipboard', description: `${packetsToCopy.length} packets copied as CSV.`});
  }

  const handleDeleteShape = (shape: string) => {
    setPackets(prev => prev.filter(p => p.shape !== shape));
    toast({ title: 'Shape Cleared', description: `All packets for shape ${shape} have been deleted.` });
  }

  const handleCopyShapeToClipboard = (shape: string) => {
      const packetsToCopy = packets.filter(p => p.shape === shape);
      handleCopyToClipboard(packetsToCopy);
  }

  const packetsInViewingBox = useMemo(() => {
    if (!viewingBox) return [];
    return packets.filter(p => p.shape === viewingBox.shape && p.boxLabel === viewingBox.boxLabel);
  }, [packets, viewingBox]);


  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
        <PageHeader title="Auto Box Sorting" description="Scan or manually enter packet details to automatically sort them into boxes." />

        <Card>
          <CardHeader>
            <CardTitle>Packet Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scan">
              <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="scan"><Barcode className="mr-2 h-4 w-4" />Scan Barcode</TabsTrigger>
                <TabsTrigger value="manual"><Pencil className="mr-2 h-4 w-4" />Manual Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="scan" className="mt-4">
                 <form onSubmit={handleBarcodeScan} className="flex gap-2 max-w-sm">
                  <Input
                    ref={barcodeInputRef}
                    placeholder="Scan barcode..."
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                  />
                  <Button type="submit" disabled={!barcode}>
                    <Barcode className="mr-2 h-4 w-4" /> Scan & Sort
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                 <form onSubmit={handleManualSubmit} className="space-y-4 max-w-sm">
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <Label htmlFor="packetNumber">Packet Number</Label>
                           <Input id="packetNumber" name="packetNumber" value={manualEntry.packetNumber} onChange={handleManualInputChange} />
                       </div>
                       <div>
                           <Label htmlFor="shape">Shape</Label>
                           <Input id="shape" name="shape" value={manualEntry.shape} onChange={handleManualInputChange} />
                       </div>
                       <div>
                           <Label htmlFor="roughWeight">Rough Wt.</Label>
                           <Input id="roughWeight" name="roughWeight" type="number" step="0.001" value={manualEntry.roughWeight} onChange={handleManualInputChange} />
                       </div>
                       <div>
                           <Label htmlFor="polishWeight">Polish Wt.</Label>
                           <Input id="polishWeight" name="polishWeight" type="number" step="0.001" value={manualEntry.polishWeight} onChange={handleManualInputChange} />
                       </div>
                   </div>
                  <Button type="submit">
                    Add Manually & Sort
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {ranges.length === 0 && (
              <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Configuration Needed</AlertTitle>
                  <AlertDescription>
                    No box sorting ranges found. Please <Link href="/control-panel" className="underline font-semibold">go to the Control Panel</Link> to set them up first.
                  </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shapeSummary.map(summary => (
             <div key={summary.shape} 
                  className={cn(
                      "bg-card shadow-sm rounded-lg border border-l-4 border-l-green-400 p-4 space-y-3 transition-all duration-300",
                      highlightedItem?.shape === summary.shape && "animate-pulse border-yellow-400 border-2"
                  )}
              >
                 <div className="flex justify-between items-start">
                     <h3 className="text-lg font-bold text-green-600 flex items-center gap-2"><Box /> {summary.shape}</h3>
                     <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete all packets for {summary.shape}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will permanently delete all {summary.totalPackets} packets for the shape {summary.shape}. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteShape(summary.shape)}>Confirm Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyShapeToClipboard(summary.shape)}>
                             <Printer className="h-4 w-4" />
                         </Button>
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                     <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-1.5"><Package size={14}/>Total Pkts</span> <span className="font-semibold">{summary.totalPackets}</span></div>
                     <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-1.5"><Scale size={14}/>Total Rgh Wt</span> <span className="font-semibold">{summary.totalRoughWeight.toFixed(3)}</span></div>
                     <div className="flex justify-between items-center col-span-2"><span className="text-muted-foreground flex items-center gap-1.5"><Scale size={14}/>Total Pls Wt</span> <span className="font-semibold">{summary.totalPolishWeight.toFixed(3)}</span></div>
                 </div>
                 
                 <div className="border-t pt-2">
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead className="h-8">Box</TableHead>
                                 <TableHead className="h-8">Pkts</TableHead>
                                 <TableHead className="h-8">Pls Wt</TableHead>
                                 <TableHead className="h-8 text-right"></TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {Object.entries(summary.boxes).sort((a,b) => a[0].localeCompare(b[0])).map(([label, data]) => (
                                 <TableRow 
                                    key={label} 
                                    onClick={() => setViewingBox({ shape: summary.shape, boxLabel: label })} 
                                    className={cn(
                                        "cursor-pointer hover:bg-muted/50 h-10 transition-colors duration-300",
                                        highlightedItem?.shape === summary.shape && highlightedItem?.boxLabel === label && "bg-yellow-100 dark:bg-yellow-900/30"
                                    )}
                                  >
                                     <TableCell><Badge variant="secondary">{label}</Badge></TableCell>
                                     <TableCell>{data.count}</TableCell>
                                     <TableCell>{data.polishWeight.toFixed(3)}</TableCell>
                                     <TableCell className="text-right p-1">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete all packets in this box?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        This will permanently delete all {data.count} packets from "{label}" in the {summary.shape} category. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteBox(summary.shape, label)}>Confirm Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                     </TableCell>
                                 </TableRow>
                             ))}
                         </TableBody>
                     </Table>
                 </div>
             </div>
          ))}
          {shapeSummary.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
                  <p>Scan or enter a packet to begin sorting.</p>
              </div>
          )}
        </div>
      </div>
      
      <Dialog open={!!viewingBox} onOpenChange={(isOpen) => !isOpen && setViewingBox(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Packets in {viewingBox?.shape} / {viewingBox?.boxLabel}</DialogTitle>
                <DialogDescription>
                    Showing {packetsInViewingBox.length} packet(s).
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Packet Number</TableHead>
                            <TableHead>Rough Wt.</TableHead>
                            <TableHead>Polish Wt.</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {packetsInViewingBox.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-mono">{p.packetNumber}</TableCell>
                                <TableCell>{p.roughWeight.toFixed(3)}</TableCell>
                                <TableCell>{p.polishWeight.toFixed(3)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleDeletePacket(p.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => handleCopyToClipboard(packetsInViewingBox)}>
                    <Copy className="mr-2 h-4 w-4" /> Copy as CSV
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

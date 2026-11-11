
'use client';
import React, { useState, useMemo, useRef, Fragment, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BOX_SORTING_RANGES_KEY, BOX_SORTING_PACKETS_KEY, DIAMETER_SORTING_RANGES_KEY, BOX_DIAMETER_PACKETS_KEY } from '@/lib/constants';
import { BoxSortingRange, BoxSortingPacket, BoxDiameterRange } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, Box, Package, Scale, Trash2, Copy, Printer, Pencil, Gem, Replace, Zap } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type ShapeSummary = {
  shape: string;
  totalPackets: number;
  totalRoughWeight: number;
  totalPolishWeight: number;
  kapanNumber: string;
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
    diameter: string;
}

type HighlightedItem = {
    shape: string;
    boxLabel: string;
} | null;

type SortingMode = 'cent' | 'diameter';

// Shape-specific animated icons
const ShapeIcon = ({ shape, className }: { shape: string, className?: string }) => {
    const shapeUpper = shape.toUpperCase();
    const iconProps = {
        className: cn("w-6 h-6 animate-spin-slow text-green-600", className),
    };

    if (shapeUpper.includes('ROUND')) {
        return <svg fill="currentColor" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" {...iconProps}>
            <path d="M2.103 12.052l13.398 16.629-5.373-16.629h-8.025zM11.584 12.052l4.745 16.663 4.083-16.663h-8.828zM17.051 28.681l12.898-16.629h-7.963l-4.935 16.629zM29.979 10.964l-3.867-6.612-3.869 6.612h7.736zM24.896 3.973h-7.736l3.867 6.839 3.869-6.839zM19.838 10.964l-3.867-6.612-3.868 6.612h7.735zM14.839 3.973h-7.735l3.868 6.839 3.867-6.839zM5.889 4.352l-3.867 6.612h7.735l-3.868-6.612z"></path>
        </svg>;
    }
    if (shapeUpper.includes('PRINCESS') || shapeUpper.includes('CHOKI') || shapeUpper.includes('SQUARE')) {
         return <svg {...iconProps}  fill="currentColor" viewBox="0 0 24 24"><path d="M5 3H19L21 5V19L19 21H5L3 19V5L5 3ZM5 5V19H19V5H5ZM7 7H17V17H7V7Z"/></svg>;
    }
    if (shapeUpper.includes('EMERALD')) {
        return <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24"><path d="M6 4H18L20 6V18L18 20H6L4 18V6L6 4ZM6 6V18H18V6H6Z"/></svg>;
    }
    if (shapeUpper.includes('PEAR')) {
        return <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C7.5 2 4 8 4 12C4 16.5 7.5 22 12 22C16.5 22 20 16.5 20 12C20 8 16.5 2 12 2ZM12 4.15L17.15 12H6.85L12 4.15Z"/></svg>;
    }
    if (shapeUpper.includes('MARQUISE')) {
        return <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12L12 22L22 12L12 2ZM4.5 12L12 5.5L19.5 12L12 18.5L4.5 12Z"/></svg>;
    }
    
    return <Gem className={cn("w-6 h-6 text-green-600", className)} />;
}


export default function BoxSortingPage() {
  const { toast } = useToast();
  const [centRanges] = useLocalStorage<BoxSortingRange[]>(BOX_SORTING_RANGES_KEY, []);
  const [diameterRanges] = useLocalStorage<BoxDiameterRange[]>(DIAMETER_SORTING_RANGES_KEY, []);
  
  const [centPackets, setCentPackets] = useLocalStorage<BoxSortingPacket[]>(BOX_SORTING_PACKETS_KEY, []);
  const [diameterPackets, setDiameterPackets] = useLocalStorage<BoxSortingPacket[]>(BOX_DIAMETER_PACKETS_KEY, []);
  
  const [sortingMode, setSortingMode] = useState<SortingMode>('cent');
  
  const [manualEntry, setManualEntry] = useState<ManualEntry>({
      packetNumber: '',
      shape: '',
      roughWeight: '',
      polishWeight: '',
      diameter: ''
  });

  const [viewingBox, setViewingBox] = useState<ViewingBox>(null);
  const [highlightedItem, setHighlightedItem] = useState<HighlightedItem>(null);
  
  const packets = sortingMode === 'cent' ? centPackets : diameterPackets;
  const setPackets = sortingMode === 'cent' ? setCentPackets : setDiameterPackets;

  useEffect(() => {
    if (highlightedItem) {
      const timer = setTimeout(() => {
        setHighlightedItem(null);
      }, 2000); // Highlight for 2 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightedItem]);
  
  const sortPacket = (packetData: Omit<BoxSortingPacket, 'id' | 'scanTime' | 'boxLabel'>) => {
    let matchedRange;
    const { polishWeight, diameter } = packetData;
    
    if (sortingMode === 'cent') {
        if (centRanges.length === 0) {
          toast({ variant: 'destructive', title: 'Setup Required', description: 'Please define cent-based box sorting ranges in the Control Panel.' });
          return false;
        }
        matchedRange = centRanges.find(r => polishWeight >= r.from && polishWeight <= r.to);
        if (!matchedRange) {
            toast({ variant: 'destructive', title: 'No Matching Box', description: `No box range configured for polish weight ${polishWeight}.` });
            return false;
        }
    } else { // diameter
        if (diameterRanges.length === 0) {
          toast({ variant: 'destructive', title: 'Setup Required', description: 'Please define diameter-based box sorting ranges in the Control Panel.' });
          return false;
        }
        if (diameter === undefined) {
             toast({ variant: 'destructive', title: 'Missing Diameter', description: `Diameter value not found in the input.` });
            return false;
        }
        matchedRange = diameterRanges.find(r => diameter >= r.from && diameter <= r.to);
        if (!matchedRange) {
            toast({ variant: 'destructive', title: 'No Matching Box', description: `No box range configured for diameter ${diameter}.` });
            return false;
        }
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
  
  useEffect(() => {
    let barcodeBuffer = '';
    
    const processBarcode = (barcode: string) => {
      if (!barcode) return;

      if (packets.some(p => p.barcode === barcode)) {
          toast({ variant: 'destructive', title: 'Duplicate Packet', description: `Packet barcode has already been scanned in this mode.` });
          return;
      }
      
      const values = barcode.split(',');
      if (values.length < 15) {
        toast({ variant: 'destructive', title: 'Invalid Barcode Format', description: `Expected at least 15 comma-separated values, but got ${values.length}.` });
        return;
      }

      const diameter = parseFloat(values[0]);
      const roughWeight = parseFloat(values[7]);
      const polishWeight = parseFloat(values[8]);
      const shape = values[11]?.trim().toUpperCase();
      const packetNumber = values[14]?.trim();

      if (isNaN(roughWeight) || isNaN(polishWeight) || !shape || !packetNumber || isNaN(diameter)) {
          toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not extract required fields (diameter, weights, shape, packet number) from barcode.' });
          return;
      }

      sortPacket({ barcode, packetNumber, shape, roughWeight, polishWeight, diameter });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            processBarcode(barcodeBuffer);
            barcodeBuffer = '';
        } else if (e.key.length === 1) { // Regular character
            barcodeBuffer += e.key;
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    }
  }, [packets, centRanges, diameterRanges, sortingMode, toast, setPackets]);


  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { packetNumber, shape, roughWeight, polishWeight, diameter } = manualEntry;

    if (!packetNumber || !shape || !roughWeight || !polishWeight || (sortingMode === 'diameter' && !diameter)) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all required fields for manual entry.' });
        return;
    }
    
    if (packets.some(p => p.packetNumber === packetNumber.trim())) {
        toast({ variant: 'destructive', title: 'Duplicate Packet', description: `Packet ${packetNumber.trim()} has already been sorted in this mode.` });
        return;
    }

    const parsedRoughWeight = parseFloat(roughWeight);
    const parsedPolishWeight = parseFloat(polishWeight);
    const parsedDiameter = parseFloat(diameter);

    if (isNaN(parsedRoughWeight) || isNaN(parsedPolishWeight) || (sortingMode === 'diameter' && isNaN(parsedDiameter))) {
        toast({ variant: 'destructive', title: 'Invalid Number', description: 'Weight and diameter must be valid numbers.' });
        return;
    }
    
    if(sortPacket({
        barcode: `manual-${packetNumber}`,
        packetNumber: packetNumber.trim(),
        shape: shape.trim().toUpperCase(),
        roughWeight: parsedRoughWeight,
        polishWeight: parsedPolishWeight,
        diameter: parsedDiameter
    })) {
        setManualEntry({ packetNumber: '', shape: '', roughWeight: '', polishWeight: '', diameter: '' });
    }
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setManualEntry(prev => ({...prev, [name]: value}));
  }

  const shapeSummary: ShapeSummary[] = useMemo(() => {
    const summary: Record<string, Omit<ShapeSummary, 'kapanNumber'> & {kapanNumbers: Set<string>}> = {};
    
    packets.forEach(packet => {
        if (!summary[packet.shape]) {
            summary[packet.shape] = {
                shape: packet.shape,
                totalPackets: 0,
                totalRoughWeight: 0,
                totalPolishWeight: 0,
                boxes: {},
                kapanNumbers: new Set()
            };
        }
        const shapeGroup = summary[packet.shape];
        shapeGroup.totalPackets++;
        shapeGroup.totalRoughWeight += packet.roughWeight;
        shapeGroup.totalPolishWeight += packet.polishWeight;
        
        const kapanPart = packet.packetNumber.split('-')[0].replace('R', '');
        if(kapanPart) shapeGroup.kapanNumbers.add(kapanPart);


        if (!shapeGroup.boxes[packet.boxLabel]) {
            shapeGroup.boxes[packet.boxLabel] = { count: 0, roughWeight: 0, polishWeight: 0 };
        }
        const boxGroup = shapeGroup.boxes[packet.boxLabel];
        boxGroup.count++;
        boxGroup.roughWeight += packet.roughWeight;
        boxGroup.polishWeight += packet.polishWeight;
    });

    return Object.values(summary).map(s => ({
        ...s,
        kapanNumber: [...s.kapanNumbers].join(', ') || 'N/A'
    })).sort((a,b) => a.shape.localeCompare(b.shape));

  }, [packets]);

  const handleDeletePacket = (packetId: string) => {
    setPackets(prev => prev.filter(p => p.id !== packetId));
    toast({ title: 'Packet Deleted' });
  };

  const handleDeleteBox = (shape: string, boxLabel: string) => {
    setPackets(prev => prev.filter(p => !(p.shape === shape && p.boxLabel === boxLabel)));
    toast({ title: 'Box Cleared', description: `All packets from ${boxLabel} in ${shape} have been deleted.`});
  }

  const handlePrintReceipt = (packetsToPrint: BoxSortingPacket[], title: string) => {
     if (packetsToPrint.length === 0) {
        toast({ variant: 'destructive', title: 'No Packets', description: 'There are no packets to print.' });
        return;
    }
    
    const firstPacket = packetsToPrint[0];
    const kapan = firstPacket.packetNumber.split('-')[0].replace('R', '') || 'N/A';
    
    const shapeMap: Record<string, string> = {
        'ROUND': 'રાઉન્ડ 4P', 'PEAR': 'પાન', 'EMERALD': 'ચોકી', 'MARQUISE': 'માર્કિસ',
        'PRINCESS': 'પ્રિન્સેસ', 'SQUARE': 'ચોકી', 'CHOKI': 'ચોકી',
    };
    const gujaratiShape = shapeMap[firstPacket.shape.toUpperCase()] || firstPacket.shape;

    const rawRoughWeight = packetsToPrint.reduce((sum, p) => sum + p.roughWeight, 0);
    const rawPolishWeight = packetsToPrint.reduce((sum, p) => sum + p.polishWeight, 0);

    const totalRoughWeight = rawRoughWeight.toFixed(3);
    const totalPolishWeight = rawPolishWeight.toFixed(3);
    const percentage = rawRoughWeight !== 0 ? ((rawPolishWeight / rawRoughWeight) * 100).toFixed(2) : '0.00';
    // Assuming 'main' packets are those ending in '-A' case-insensitive.
    const mainPackets = packetsToPrint.filter(p => /[Aa]$/.test(p.packetNumber)).length;
    const grandTotalPcs = packetsToPrint.length;
    const showPercentage = sortingMode === 'cent';

    const html = `
        <html><head><title>Receipt</title><style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&display=swap');
        body{font-family:'Noto Sans Gujarati',sans-serif;font-size:16px;padding:10px 15px;box-sizing:border-box;width:300px;}
        .top,.bottom{display:flex;justify-content:space-between;font-weight:bold;}
        .top{margin-bottom:40px;}.bottom{margin-top:60px;}.left-block,.right-block{line-height:1.6;}
        .left-block{text-align:left;}.right-block{text-align:right;}
        </style></head><body>
        <div class="top"><div>કાપણ: ${kapan}</div><div>${gujaratiShape} ${title}</div></div>
        <div class="bottom"><div class="left-block"><div>તૈ.વજન: ${totalPolishWeight}</div>
        ${showPercentage ? `<div>ટકા: ${percentage}%</div>` : ''}
        </div>
        <div class="right-block">
        ${showPercentage ? `<div>મેન: ${mainPackets}</div>` : ''}
        <div>થાન: ${grandTotalPcs}</div><div>કા.વજન: ${totalRoughWeight}</div></div></div>
        </body></html>`;

    const printWindow = window.open('', '', 'width=400,height=600');
    if(printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    } else {
        toast({variant: 'destructive', title: 'Print Error', description: 'Could not open print window. Check popup blocker.'})
    }
  }

  const handleDeleteShape = (shape: string) => {
    setPackets(prev => prev.filter(p => p.shape !== shape));
    toast({ title: 'Shape Cleared', description: `All packets for shape ${shape} have been deleted.` });
  }
  
  const handlePrintShapeReceipt = (shape: string) => {
      const packetsToPrint = packets.filter(p => p.shape === shape);
      handlePrintReceipt(packetsToPrint, "");
  }

  const packetsInViewingBox = useMemo(() => {
    if (!viewingBox) return [];
    return packets.filter(p => p.shape === viewingBox.shape && p.boxLabel === viewingBox.boxLabel);
  }, [packets, viewingBox]);

  const ranges = sortingMode === 'cent' ? centRanges : diameterRanges;
  const noRangesConfigured = ranges.length === 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        // Prevent default browser behavior if needed
        e.preventDefault();

        // Find the first box of the first shape
        if (shapeSummary.length > 0) {
          const firstShape = shapeSummary[0];
          const firstBoxLabel = Object.keys(firstShape.boxes).sort((a,b) => a.localeCompare(b))[0];

          if (firstShape && firstBoxLabel) {
            handleDeleteBox(firstShape.shape, firstBoxLabel);
          }
        } else {
            toast({variant: 'destructive', title: 'No Boxes', description: 'There are no boxes to delete.'})
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shapeSummary, setPackets, toast]);


  return (
    <>
      <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
        <PageHeader title="Auto Box Sorting" description="Scan or manually enter packet details to automatically sort them into boxes." />

        <Card>
            <CardHeader><CardTitle>Sorting Mode</CardTitle></CardHeader>
            <CardContent>
                 <RadioGroup value={sortingMode} onValueChange={(val) => setSortingMode(val as SortingMode)} className="flex gap-4">
                     <Label htmlFor="mode-cent" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary">
                         <RadioGroupItem value="cent" id="mode-cent" /> <Scale className="h-4 w-4" /> Sort by Cent
                      </Label>
                      <Label htmlFor="mode-diameter" className="flex items-center gap-2 border rounded-md p-3 cursor-pointer has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:border-primary">
                         <RadioGroupItem value="diameter" id="mode-diameter" /> <Replace className="h-4 w-4" /> Sort by Diameter
                      </Label>
                  </RadioGroup>
            </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Packet Entry</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="scan">
              <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="scan"><Barcode className="mr-2 h-4 w-4" />Scan Barcode</TabsTrigger>
                <TabsTrigger value="manual"><Pencil className="mr-2 h-4 w-4" />Manual Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="scan" className="mt-4">
                 <Alert variant="default" className="max-w-sm">
                    <Zap className="h-4 w-4 text-green-500" />
                    <AlertTitle>Auto-Scan Mode is Active</AlertTitle>
                    <AlertDescription>The page is listening for your barcode scanner. No need to click or type in a box.</AlertDescription>
                 </Alert>
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                 <form onSubmit={handleManualSubmit} className="space-y-4 max-w-lg">
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                       <div>
                           <Label htmlFor="packetNumber">Packet Number</Label>
                           <Input id="packetNumber" name="packetNumber" value={manualEntry.packetNumber} onChange={handleManualInputChange} />
                       </div>
                       <div>
                           <Label htmlFor="shape">Shape</Label>
                           <Input id="shape" name="shape" value={manualEntry.shape} onChange={handleManualInputChange} />
                       </div>
                       {sortingMode === 'diameter' && 
                        <div>
                           <Label htmlFor="diameter">Diameter (mm)</Label>
                           <Input id="diameter" name="diameter" type="number" step="0.01" value={manualEntry.diameter} onChange={handleManualInputChange} />
                       </div>
                       }
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
            
            {noRangesConfigured && (
              <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Configuration Needed</AlertTitle>
                  <AlertDescription>
                    No box sorting ranges found for the "{sortingMode}" mode. Please <Link href="/control-panel" className="underline font-semibold">go to the Control Panel</Link> to set them up first.
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
                     <h3 className="text-lg font-bold text-green-600 flex items-center gap-2">
                        <ShapeIcon shape={summary.shape} />
                        {summary.shape}
                     </h3>
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
                                    This will permanently delete all {summary.totalPackets} packets for the shape {summary.shape} in the current mode. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteShape(summary.shape)}>Confirm Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrintShapeReceipt(summary.shape)}>
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
                                                        This will permanently delete all {data.count} packets from "{label}" in the {summary.shape} category for the current mode. This action cannot be undone.
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
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Packets in {viewingBox?.shape} / {viewingBox?.boxLabel}</DialogTitle>
                <DialogDescription>
                    Showing {packetsInViewingBox.length} packet(s) for sorting mode: <span className="font-semibold capitalize">{sortingMode}</span>.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Packet Number</TableHead>
                            {sortingMode === 'diameter' && <TableHead>Diameter</TableHead>}
                            <TableHead>Rough Wt.</TableHead>
                            <TableHead>Polish Wt.</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {packetsInViewingBox.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-mono">{p.packetNumber}</TableCell>
                                {sortingMode === 'diameter' && <TableCell>{p.diameter?.toFixed(2)} mm</TableCell>}
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
                <Button variant="outline" onClick={() => handlePrintReceipt(packetsInViewingBox, `(Box: ${viewingBox?.boxLabel})`)}>
                    <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';
import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BOX_SORTING_RANGES_KEY, BOX_SORTING_PACKETS_KEY } from '@/lib/constants';
import { BoxSortingRange, BoxSortingPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, Box, Package, Scale, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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

export default function BoxSortingPage() {
  const { toast } = useToast();
  const [ranges] = useLocalStorage<BoxSortingRange[]>(BOX_SORTING_RANGES_KEY, []);
  const [packets, setPackets] = useLocalStorage<BoxSortingPacket[]>(BOX_SORTING_PACKETS_KEY, []);
  
  const [barcode, setBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    if (ranges.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Setup Required',
        description: 'Please define box sorting ranges in the Control Panel first.',
      });
      return;
    }
    
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

    if (packets.some(p => p.packetNumber === packetNumber)) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Packet',
            description: `Packet ${packetNumber} has already been scanned.`,
        });
        setBarcode('');
        return;
    }
    
    const matchedRange = ranges.find(r => polishWeight >= r.from && polishWeight <= r.to);
    if (!matchedRange) {
        toast({
            variant: 'destructive',
            title: 'No Matching Box',
            description: `No box range configured for polish weight ${polishWeight}.`,
        });
        return;
    }

    const newPacket: BoxSortingPacket = {
      id: uuidv4(),
      barcode,
      packetNumber,
      shape,
      roughWeight,
      polishWeight,
      boxLabel: matchedRange.label,
      scanTime: new Date().toISOString(),
    };

    setPackets(prev => [...prev, newPacket]);
    toast({
        title: `Packet Added to ${shape} / ${matchedRange.label}`,
        description: `Packet ${packetNumber} sorted successfully.`,
    });
    setBarcode('');
    barcodeInputRef.current?.focus();
  };

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

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Auto Box Sorting" description="Scan packet barcodes to automatically sort them into boxes." />

       <Card>
        <CardHeader>
          <CardTitle>Scan Packet Barcode</CardTitle>
        </CardHeader>
        <CardContent>
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
           {ranges.length === 0 && (
             <Alert variant="destructive" className="mt-4">
                <AlertTitle>Configuration Needed</AlertTitle>
                <AlertDescription>
                  No box sorting ranges found. Please <Link href="/control-panel" className="underline">go to the Control Panel</Link> to set them up first.
                </AlertDescription>
             </Alert>
           )}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shapeSummary.map(summary => (
            <Card key={summary.shape}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Box /> {summary.shape}
                    </CardTitle>
                    <CardDescription className="grid grid-cols-3 gap-x-4 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Package className="h-4 w-4 text-muted-foreground"/> 
                            <div>
                                <strong>{summary.totalPackets}</strong>
                                <span className="text-muted-foreground"> pkts</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Scale className="h-4 w-4 text-muted-foreground"/> 
                            <div>
                                <strong>{summary.totalRoughWeight.toFixed(3)}</strong>
                                <span className="text-muted-foreground"> rgh</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Scale className="h-4 w-4 text-muted-foreground"/> 
                             <div>
                                <strong>{summary.totalPolishWeight.toFixed(3)}</strong>
                                <span className="text-muted-foreground"> pol</span>
                            </div>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Box</TableHead>
                                <TableHead>Packets</TableHead>
                                <TableHead>Polish Wt.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(summary.boxes).map(([label, data]) => (
                                <TableRow key={label}>
                                    <TableCell><Badge variant="secondary">{label}</Badge></TableCell>
                                    <TableCell>{data.count}</TableCell>
                                    <TableCell>{data.polishWeight.toFixed(3)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
        {shapeSummary.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
                <p>Scan a packet to begin sorting.</p>
            </div>
        )}
      </div>

    </div>
  );
}

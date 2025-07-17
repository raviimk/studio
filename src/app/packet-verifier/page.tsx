
'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Barcode, CheckCircle2, ClipboardCopy, List, ListX, Lock, Unlock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExpectedPacket = {
  packetNumber: string;
  quantity: string;
  weight: string;
  polishWeight: string;
};

export default function PacketVerifierPage() {
  const { toast } = useToast();

  const [pastedData, setPastedData] = useState('');
  const [expectedPackets, setExpectedPackets] = useState<ExpectedPacket[]>([]);
  const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set());
  const [isLocked, setIsLocked] = useState(false);
  const [scanInput, setScanInput] = useState('');

  const handleLockList = () => {
    if (!pastedData.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Pasted data cannot be empty.' });
      return;
    }
    const lines = pastedData.trim().split('\n');
    const parsedPackets: ExpectedPacket[] = [];
    
    for (const line of lines) {
        const parts = line.split(/[,\t]/); // Split by comma or tab
        if (parts.length >= 4) {
            const [packetNumber, quantity, weight, polishWeight] = parts;
            if (packetNumber.trim()) {
                 parsedPackets.push({
                    packetNumber: packetNumber.trim(),
                    quantity: quantity.trim(),
                    weight: weight.trim(),
                    polishWeight: polishWeight.trim(),
                });
            }
        }
    }
    
    if(parsedPackets.length === 0) {
        toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not parse any valid packets. Ensure format is: Packet,Qty,Wt,PolishWt' });
        return;
    }

    setExpectedPackets(parsedPackets);
    setIsLocked(true);
    toast({ title: 'List Locked', description: `Loaded ${parsedPackets.length} packets. You can now start scanning.`});
  };

  const handleUnlockList = () => {
    setIsLocked(false);
    setExpectedPackets([]);
    setScannedBarcodes(new Set());
    setPastedData('');
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    // Logic to extract packet number from various barcode formats
    let packetNumber = scanInput.trim();
    const match = packetNumber.match(/^(?:R)?\d+-\d+(?:-(.+))?$/); // For "Kapan-Packet-Suffix"
    if (match) {
        const [, , mainPart, suffix] = match;
        // Reconstruct a key if needed, or assume the full string is the key. 
        // For this generic verifier, we'll use the full barcode string.
    } else {
        const commaParts = packetNumber.split(',');
        if (commaParts.length > 14) { // Heuristic for the long barcode
            packetNumber = commaParts[14].trim();
        }
    }

    if (scannedBarcodes.has(packetNumber)) {
        toast({ variant: 'destructive', title: 'Already Scanned', description: `Packet ${packetNumber} has already been scanned.`});
    } else {
        setScannedBarcodes(new Set(scannedBarcodes).add(packetNumber));
        toast({ title: 'Packet Scanned', description: packetNumber });
    }
    setScanInput('');
  };

  const { matched, missing, extra } = useMemo(() => {
    const expectedSet = new Set(expectedPackets.map(p => p.packetNumber));
    
    const matchedPackets = expectedPackets.filter(p => scannedBarcodes.has(p.packetNumber));
    const missingPackets = expectedPackets.filter(p => !scannedBarcodes.has(p.packetNumber));
    const extraPackets = [...scannedBarcodes].filter(b => !expectedSet.has(b));

    return { matched: matchedPackets, missing: missingPackets, extra: extraPackets };
  }, [expectedPackets, scannedBarcodes]);

  const handleCopyReport = () => {
    let report = '--- PACKET VERIFICATION REPORT ---\n\n';
    report += `--- MISSING (${missing.length}) ---\n`;
    missing.forEach(p => report += `${p.packetNumber}\n`);
    report += `\n--- EXTRA (${extra.length}) ---\n`;
    extra.forEach(b => report += `${b}\n`);
    
    navigator.clipboard.writeText(report);
    toast({ title: 'Report Copied', description: 'Missing and extra packets copied to clipboard.'});
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Packet Verifier" description="Paste a list of expected packets, then scan to verify." />

      {!isLocked ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Provide Expected Packet List</CardTitle>
            <CardDescription>Paste your data from Excel or another source. The format should be: <span className="font-mono text-xs">Packet Number, Quantity, Weight, Polish Wt</span> per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
              placeholder="78-246-E,1,0.021,0.004..."
              className="font-mono"
            />
            <Button onClick={handleLockList} className="mt-4"><Lock className="mr-2" /> Lock List & Begin Scanning</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total in List</CardTitle><List/></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{expectedPackets.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Matched</CardTitle><CheckCircle2 className="text-green-600"/></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{matched.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Missing</CardTitle><ListX className="text-yellow-600"/></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{missing.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Extra Scanned</CardTitle><XCircle className="text-red-600"/></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{extra.length}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Scan Packets</CardTitle>
                    <div className="flex justify-between items-center">
                        <CardDescription>Scan barcodes one-by-one to verify against the list.</CardDescription>
                         <div className="flex gap-2">
                             <Button onClick={handleCopyReport} variant="outline"><ClipboardCopy className="mr-2"/> Copy Report</Button>
                            <Button onClick={handleUnlockList} variant="secondary"><Unlock className="mr-2"/> Start Over</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleScan} className="flex gap-2 max-w-sm">
                        <Input
                            placeholder="Scan barcode..."
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            autoFocus
                        />
                        <Button type="submit"><Barcode className="mr-2" /> Scan</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className={cn(missing.length === 0 && "border-green-500")}>
                    <CardHeader><CardTitle>Missing ({missing.length})</CardTitle></CardHeader>
                    <CardContent><PacketTable packets={missing} /></CardContent>
                </Card>
                <Card className={cn(extra.length > 0 && "border-red-500")}>
                    <CardHeader><CardTitle>Extra ({extra.length})</CardTitle></CardHeader>
                    <CardContent><BarePacketTable barcodes={extra} /></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Matched ({matched.length})</CardTitle></CardHeader>
                    <CardContent><PacketTable packets={matched} /></CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}


function PacketTable({ packets }: { packets: ExpectedPacket[] }) {
    if (packets.length === 0) return <p className="text-sm text-center text-muted-foreground py-4">None</p>;

    return (
        <div className="max-h-96 overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Packet #</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Polish Wt</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {packets.map(p => (
                        <TableRow key={p.packetNumber}>
                            <TableCell className="font-mono text-xs">{p.packetNumber}</TableCell>
                            <TableCell>{p.quantity}</TableCell>
                            <TableCell>{p.polishWeight}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function BarePacketTable({ barcodes }: { barcodes: string[] }) {
    if (barcodes.length === 0) return <p className="text-sm text-center text-muted-foreground py-4">None</p>;

    return (
        <div className="max-h-96 overflow-y-auto">
            <Table>
                 <TableHeader>
                    <TableRow>
                        <TableHead>Scanned Barcode</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {barcodes.map(b => (
                        <TableRow key={b}>
                            <TableCell className="font-mono text-xs">{b}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

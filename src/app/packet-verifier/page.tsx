
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

// Helper function to normalize packet numbers by removing the 'R' prefix
const normalizePacketNumber = (packet: string): string => {
  const trimmed = packet.trim();
  if (trimmed.toUpperCase().startsWith('R')) {
    return trimmed.substring(1);
  }
  return trimmed;
};

export default function PacketVerifierPage() {
  const { toast } = useToast();

  const [pastedData, setPastedData] = useState('');
  const [expectedPackets, setExpectedPackets] = useState<Set<string>>(new Set());
  const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set());
  const [isLocked, setIsLocked] = useState(false);
  const [scanInput, setScanInput] = useState('');

  const handleLockList = () => {
    if (!pastedData.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Pasted data cannot be empty.' });
      return;
    }
    const lines = pastedData.trim().split('\n');
    const parsedPackets = new Set(
        lines.map(normalizePacketNumber).filter(p => p) // Normalize and filter empty lines
    );
    
    if(parsedPackets.size === 0) {
        toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not parse any valid packets.' });
        return;
    }

    setExpectedPackets(parsedPackets);
    setIsLocked(true);
    toast({ title: 'List Locked', description: `Loaded ${parsedPackets.size} packets. You can now start scanning.`});
  };

  const handleUnlockList = () => {
    setIsLocked(false);
    setExpectedPackets(new Set());
    setScannedBarcodes(new Set());
    setPastedData('');
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    const normalizedScannedPacket = normalizePacketNumber(scanInput);

    if (scannedBarcodes.has(normalizedScannedPacket)) {
        toast({ variant: 'destructive', title: 'Already Scanned', description: `Packet ${normalizedScannedPacket} has already been scanned.`});
    } else {
        setScannedBarcodes(new Set(scannedBarcodes).add(normalizedScannedPacket));
        toast({ title: 'Packet Scanned', description: normalizedScannedPacket });
    }
    setScanInput('');
  };

  const { matched, missing, extra } = useMemo(() => {
    const matchedPackets = new Set([...expectedPackets].filter(p => scannedBarcodes.has(p)));
    const missingPackets = new Set([...expectedPackets].filter(p => !scannedBarcodes.has(p)));
    const extraPackets = new Set([...scannedBarcodes].filter(b => !expectedPackets.has(b)));

    return { matched: [...matchedPackets], missing: [...missingPackets], extra: [...extraPackets] };
  }, [expectedPackets, scannedBarcodes]);

  const handleCopyReport = () => {
    let report = '--- PACKET VERIFICATION REPORT ---\n\n';
    report += `--- MISSING (${missing.length}) ---\n`;
    missing.forEach(p => report += `${p}\n`);
    report += `\n--- EXTRA SCANNED (${extra.length}) ---\n`;
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
            <CardDescription>Paste your list of packet numbers, one per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
              placeholder={'R77-185-D\n77-114-C\n77-279-C'}
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
                    <CardContent><div className="text-2xl font-bold">{expectedPackets.size}</div></CardContent>
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
                    <CardContent><PacketList barcodes={missing} /></CardContent>
                </Card>
                <Card className={cn(extra.length > 0 && "border-red-500")}>
                    <CardHeader><CardTitle>Extra ({extra.length})</CardTitle></CardHeader>
                    <CardContent><PacketList barcodes={extra} /></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Matched ({matched.length})</CardTitle></CardHeader>
                    <CardContent><PacketList barcodes={matched} /></CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}


function PacketList({ barcodes }: { barcodes: string[] }) {
    if (barcodes.length === 0) return <p className="text-sm text-center text-muted-foreground py-4">None</p>;

    return (
        <div className="max-h-96 overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Packet #</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {barcodes.sort().map(p => (
                        <TableRow key={p}>
                            <TableCell className="font-mono text-xs">{p}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

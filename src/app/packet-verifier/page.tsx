'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Barcode, CheckCircle2, ClipboardCopy, List, ListX, Lock, Unlock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// Helper function to find a packet number in a string and normalize it by removing the 'R' prefix
const findAndNormalizePacketNumber = (line: string): string | null => {
  const trimmedLine = line.trim();
  // Regex to find patterns like R77-185-D or 77-114-C
  const match = trimmedLine.match(/(R?\d+-\d+(?:-[A-Z])?)/);

  if (!match) {
    return null;
  }

  let packetNumber = match[1];
  if (packetNumber.toUpperCase().startsWith('R')) {
    packetNumber = packetNumber.substring(1);
  }
  
  return packetNumber;
};


// Helper function to normalize a scanned barcode
const normalizeScannedBarcode = (packet: string): string => {
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

    // New state for highlighting and recent scans
    const [highlightedStatus, setHighlightedStatus] = useState<'matched' | 'extra' | null>(null);
    const [recentScans, setRecentScans] = useState<string[]>([]);
    
    // Effect to clear highlight after a delay
    useEffect(() => {
        if (highlightedStatus) {
          const timer = setTimeout(() => setHighlightedStatus(null), 2000);
          return () => clearTimeout(timer);
        }
    }, [highlightedStatus]);


    const handleLockList = () => {
        if (!pastedData.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Pasted data cannot be empty.' });
            return;
        }
        const lines = pastedData.trim().split('\n');
        const parsedPackets = new Set(
            lines.map(findAndNormalizePacketNumber).filter((p): p is string => p !== null)
        );
        
        if(parsedPackets.size === 0) {
            toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not parse any valid packets from the pasted data.' });
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
        setRecentScans([]); // Clear recent scans too
    };

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanInput.trim()) return;
        
        const normalizedScannedPacket = normalizeScannedBarcode(scanInput);

        if (scannedBarcodes.has(normalizedScannedPacket)) {
            toast({ variant: 'destructive', title: 'Already Scanned', description: `Packet ${normalizedScannedPacket} has already been scanned.`});
        } else {
            setScannedBarcodes(new Set(scannedBarcodes).add(normalizedScannedPacket));
            
            // New logic
            setRecentScans(prev => [normalizedScannedPacket, ...prev].slice(0, 10));

            if (expectedPackets.has(normalizedScannedPacket)) {
                setHighlightedStatus('matched');
                toast({ title: 'Packet Matched!', description: normalizedScannedPacket });
            } else {
                setHighlightedStatus('extra');
                toast({ title: 'Extra Packet Scanned', description: normalizedScannedPacket, variant: 'destructive' });
            }
        }
        setScanInput('');
    };

    const { matched, missing, extra } = useMemo(() => {
        const matchedPackets = [...expectedPackets].filter(p => scannedBarcodes.has(p));
        const missingPackets = [...expectedPackets].filter(p => !scannedBarcodes.has(p));
        const extraPackets = [...scannedBarcodes].filter(b => !expectedPackets.has(b));

        return { matched: matchedPackets, missing: missingPackets, extra: extraPackets };
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

    const mostRecentScan = recentScans[0] || null;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Packet Verifier" description="Paste a list of expected packets, then scan to verify." />

      {!isLocked ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Provide Expected Packet List</CardTitle>
            <CardDescription>Paste your list of packets, one per line. The tool will automatically extract the packet number (e.g., 77-114-C).</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
              placeholder={'Example:\nR77-185-D, 1, 0.033, 0.011\n77-114-C  1  0.042  0.016'}
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
                     {recentScans.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Recent Scans:</h4>
                            <div className="flex flex-wrap gap-2">
                            {recentScans.map((scan, index) => (
                                <Badge key={index} variant={index === 0 ? "default" : "secondary"} className="font-mono">{scan}</Badge>
                            ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className={cn(missing.length > 0 && "border-yellow-500/60")}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><ListX className="text-yellow-600" /> Missing</span>
                            <Badge variant="outline">{missing.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent><PacketList barcodes={missing} mostRecentScan={mostRecentScan} /></CardContent>
                </Card>
                <Card className={cn("transition-all", extra.length > 0 && "border-red-500/60", highlightedStatus === 'extra' && "ring-2 ring-yellow-400")}>
                    <CardHeader>
                         <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><XCircle className="text-red-500" /> Extra</span>
                            <Badge variant="destructive">{extra.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent><PacketList barcodes={extra} mostRecentScan={mostRecentScan} /></CardContent>
                </Card>
                 <Card className={cn("transition-all border-green-500/60", highlightedStatus === 'matched' && "ring-2 ring-yellow-400")}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Matched</span>
                            <Badge>{matched.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent><PacketList barcodes={matched} mostRecentScan={mostRecentScan} /></CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}


function PacketList({ barcodes, mostRecentScan }: { barcodes: string[]; mostRecentScan: string | null }) {
    const sortedBarcodes = useMemo(() => {
        const sorted = [...barcodes].sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
        if (mostRecentScan && sorted.includes(mostRecentScan)) {
            return [mostRecentScan, ...sorted.filter(b => b !== mostRecentScan)];
        }
        return sorted;
    }, [barcodes, mostRecentScan]);
    
    if (sortedBarcodes.length === 0) return <p className="text-sm text-center text-muted-foreground py-4">None</p>;

    return (
        <div className="max-h-96 overflow-y-auto mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Packet #</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedBarcodes.map(p => (
                        <TableRow key={p} className={cn(p === mostRecentScan && "bg-yellow-100 dark:bg-yellow-900/30")}>
                            <TableCell className="font-mono text-xs">{p}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, ListX, XCircle, GitCompare, ClipboardCopy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type PacketResult = {
    matched: string[];
    unmatched: string[];
    extra: string[];
};

// Extracts a packet number from the start of a line
const extractPacketNumber = (line: string): string | null => {
  const trimmedLine = line.trim();
  const match = trimmedLine.match(/^\d+/);
  return match ? match[0] : null;
};


export default function PacketMatcherPage() {
    const { toast } = useToast();
    const [listOneData, setListOneData] = useState('');
    const [listTwoData, setListTwoData] = useState('');
    const [results, setResults] = useState<PacketResult | null>(null);
    
    const handleMatch = () => {
        if (!listOneData.trim() || !listTwoData.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please paste data into both lists.' });
            return;
        }

        const listOnePackets = new Set(
            listOneData.trim().split('\n').map(line => line.trim()).filter(Boolean)
        );

        const listTwoPackets = new Set(
            listTwoData.trim().split('\n').map(extractPacketNumber).filter((p): p is string => p !== null)
        );
        
        if(listOnePackets.size === 0 || listTwoPackets.size === 0) {
            toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not find valid packet numbers in one or both lists.' });
            return;
        }
        
        const matched = [...listOnePackets].filter(p => listTwoPackets.has(p));
        const unmatched = [...listOnePackets].filter(p => !listTwoPackets.has(p));
        const extra = [...listTwoPackets].filter(p => !listOnePackets.has(p));

        setResults({ matched, unmatched, extra });
        toast({ title: 'Matching Complete', description: `Found ${unmatched.length} unmatched packets.` });
    };

    const handleCopyUnmatched = () => {
        if (results && results.unmatched.length > 0) {
            navigator.clipboard.writeText(results.unmatched.join('\n'));
            toast({ title: 'Copied!', description: 'Unmatched packet numbers copied to clipboard.' });
        }
    };


    return (
        <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
            <PageHeader title="Packet Matcher" description="Compare two lists of packets to find what's missing." />

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>List 1: Your Packet Numbers</CardTitle>
                        <CardDescription>Paste your simple list of packet numbers here, one per line.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={listOneData}
                            onChange={(e) => setListOneData(e.target.value)}
                            rows={15}
                            placeholder="862\n853\n798..."
                            className="font-mono"
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>List 2: Data to Match Against</CardTitle>
                        <CardDescription>Paste the full data block here. The tool will look at the first number on each line.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={listTwoData}
                            onChange={(e) => setListTwoData(e.target.value)}
                            rows={15}
                            placeholder="182    0.248    5    0.230...\n546    0.285    8    0.258..."
                            className="font-mono"
                        />
                    </CardContent>
                </Card>
            </div>
            
            <div className="text-center">
                <Button onClick={handleMatch} size="lg" disabled={!listOneData || !listTwoData}>
                    <GitCompare className="mr-2 h-5 w-5" /> Match Packet Lists
                </Button>
            </div>

            {results && (
                 <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="border-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><XCircle className="text-red-500" /> Unmatched</span>
                                <Badge variant="destructive">{results.unmatched.length}</Badge>
                            </CardTitle>
                            <CardDescription>Packets from List 1 <span className="font-bold">NOT</span> found in List 2.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" size="sm" onClick={handleCopyUnmatched} disabled={results.unmatched.length === 0}>
                                <ClipboardCopy className="mr-2 h-4 w-4"/> Copy List
                            </Button>
                            <PacketListTable packets={results.unmatched} />
                        </CardContent>
                    </Card>
                    <Card className="border-green-500">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Matched</span>
                                <Badge>{results.matched.length}</Badge>
                            </CardTitle>
                             <CardDescription>Packets found in both lists.</CardDescription>
                        </CardHeader>
                        <CardContent><PacketListTable packets={results.matched} /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><ListX /> Extra</span>
                                <Badge variant="secondary">{results.extra.length}</Badge>
                            </CardTitle>
                            <CardDescription>Packets in List 2 but not in List 1.</CardDescription>
                        </CardHeader>
                        <CardContent><PacketListTable packets={results.extra} /></CardContent>
                    </Card>
                 </div>
            )}
        </div>
    );
}

function PacketListTable({ packets }: { packets: string[] }) {
    if (packets.length === 0) return <p className="text-sm text-center text-muted-foreground pt-8">None</p>;

    return (
        <div className="max-h-96 overflow-y-auto mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Packet #</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {packets.sort((a,b) => parseInt(a) - parseInt(b)).map(p => (
                        <TableRow key={p}>
                            <TableCell className="font-mono text-xs">{p}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, XCircle, FileDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';


const HEADERS = ['SR', 'RO WT', 'MK PCS', 'MK WT', 'EP WT', 'R TO P %', 'EXP %'];

type PacketData = {
    sr: number;
    data: string[];
    status: 'valid' | 'missing';
}

export default function KapanVerifierPage() {
    const { toast } = useToast();
    const [pastedData, setPastedData] = useState('');
    const [verifiedData, setVerifiedData] = useState<PacketData[]>([]);
    const [missingSerials, setMissingSerials] = useState<number[]>([]);

    const handleVerify = () => {
        const lines = pastedData.trim().split('\n');
        const parsedData: PacketData[] = [];
        const foundSerials = new Set<number>();

        let maxSerial = 0;

        lines.forEach(line => {
            const columns = line.split(/\t|\|/); // Split by tab or pipe
            const srString = columns[0]?.trim();
            const sr = parseInt(srString, 10);
            
            if (!isNaN(sr)) {
                foundSerials.add(sr);
                if (sr > maxSerial) maxSerial = sr;

                parsedData.push({
                    sr: sr,
                    data: columns.slice(1).map(c => c.trim()).slice(0, HEADERS.length -1),
                    status: 'valid'
                });
            }
        });

        if (maxSerial === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find any valid serial numbers.' });
            return;
        }

        const allData: PacketData[] = [];
        const missing: number[] = [];

        for (let i = 1; i <= maxSerial; i++) {
            const foundPacket = parsedData.find(p => p.sr === i);
            if (foundPacket) {
                allData.push(foundPacket);
            } else {
                missing.push(i);
                allData.push({
                    sr: i,
                    data: Array(HEADERS.length - 1).fill(''),
                    status: 'missing'
                });
            }
        }
        
        setVerifiedData(allData);
        setMissingSerials(missing);
        toast({ title: 'Verification Complete', description: `Found ${missing.length} missing serial(s).` });
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += [...HEADERS, 'Status'].join(',') + '\r\n';

        verifiedData.forEach(row => {
            const rowData = [row.sr, ...row.data, row.status].join(',');
            csvContent += rowData + '\r\n';
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "kapan_verification_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusIcon = (status: PacketData['status']) => {
        switch (status) {
            case 'valid': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case 'missing': return <XCircle className="h-5 w-5 text-red-600" />;
            default: return null;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
            <PageHeader title="Kapan Verifier" description="Paste tab-separated data to find missing serial numbers." />

            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Paste Data</CardTitle>
                    <CardDescription>Paste your raw data from the source file. The tool will parse it and look for missing SR numbers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={pastedData}
                        onChange={(e) => setPastedData(e.target.value)}
                        rows={10}
                        placeholder={'Paste your tab-separated data here...'}
                        className="font-mono"
                    />
                    <Button onClick={handleVerify} className="mt-4" disabled={!pastedData}>
                        <Activity className="mr-2 h-4 w-4" /> Verify Data
                    </Button>
                </CardContent>
            </Card>
            
            {verifiedData.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Verification Results</CardTitle>
                            <Button variant="outline" onClick={handleExportCSV}>
                                <FileDown className="mr-2 h-4 w-4" /> Export to CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {missingSerials.length > 0 && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Missing Rows Detected!</AlertTitle>
                                <AlertDescription>
                                    The following serial numbers are missing: <strong>{missingSerials.join(', ')}</strong>
                                </AlertDescription>
                            </Alert>
                        )}
                         {missingSerials.length === 0 && (
                             <Alert className="mb-6 border-green-500 text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>All Good!</AlertTitle>
                                <AlertDescription>
                                    No missing serial numbers were detected in the provided data.
                                </AlertDescription>
                            </Alert>
                         )}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {HEADERS.map(h => <TableHead key={h}>{h}</TableHead>)}
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {verifiedData.map(row => (
                                        <TableRow key={row.sr} className={cn(row.status === 'missing' && 'bg-destructive/10')}>
                                            <TableCell className="font-bold">{row.sr}</TableCell>
                                            {row.data.map((cell, index) => <TableCell key={index}>{cell || '–'}</TableCell>)}
                                            <TableCell className="flex items-center gap-2">
                                                {getStatusIcon(row.status)} {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

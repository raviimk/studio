
'use client';
import React, { useState, useMemo } from 'react';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { 
    JIRAM_REPORT_PACKETS_KEY, 
    SARIN_PACKETS_KEY,
    LASER_LOTS_KEY,
    FOURP_TECHING_LOTS_KEY,
    UHDHA_PACKETS_KEY,
    BOX_SORTING_PACKETS_KEY,
    BOX_DIAMETER_PACKETS_KEY
} from '@/lib/constants';
import { JiramReportPacket, SarinPacket, LaserLot, FourPLot, UdhdaPacket, BoxSortingPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, CheckCircle2, AlertTriangle, XCircle, Trash2, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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


type KapanSummary = {
  kapanNumber: string;
  expected: number;
  scanned: number;
  status: 'match' | 'extra' | 'less';
  extra: number;
  missing: number;
};

// Helper to extract kapan number from various formats
const getKapanFromIdentifier = (identifier: string): string | null => {
  const match = identifier.match(/^(?:R)?(\d+)/);
  return match ? match[1] : null;
};


export default function JiramReportPage() {
  const { toast } = useToast();
  const [jiramPackets, setJiramPackets] = useSyncedStorage<JiramReportPacket[]>(JIRAM_REPORT_PACKETS_KEY, []);
  const [sarinPackets, setSarinPackets] = useSyncedStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots, setLaserLots] = useSyncedStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [fourPLots, setFourPLots] = useSyncedStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [udhdhaPackets, setUdhdhaPackets] = useSyncedStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
  const [boxSortingPackets, setBoxSortingPackets] = useSyncedStorage<BoxSortingPacket[]>(BOX_SORTING_PACKETS_KEY, []);
  const [boxDiameterPackets, setBoxDiameterPackets] = useSyncedStorage<BoxSortingPacket[]>(BOX_DIAMETER_PACKETS_KEY, []);


  const [barcode, setBarcode] = useState('');
  const [selectedKapan, setSelectedKapan] = useState<string | null>(null);

  const kapanSummary = useMemo((): KapanSummary[] => {
    const kapanData: Record<string, { expected: number; scanned: number }> = {};

    // Calculate expected jiram from Sarin entries
    sarinPackets.forEach(p => {
      if (p.jiramCount && p.jiramCount > 0) {
        if (!kapanData[p.kapanNumber]) {
          kapanData[p.kapanNumber] = { expected: 0, scanned: 0 };
        }
        kapanData[p.kapanNumber].expected += p.jiramCount;
      }
    });

    // Calculate scanned jiram from this module's entries
    jiramPackets.forEach(p => {
      if (!kapanData[p.kapanNumber]) {
        kapanData[p.kapanNumber] = { expected: 0, scanned: 0 };
      }
      kapanData[p.kapanNumber].scanned += 1;
    });

    return Object.entries(kapanData).map(([kapanNumber, data]) => {
      const diff = data.scanned - data.expected;
      let status: KapanSummary['status'] = 'match';
      if (diff > 0) status = 'extra';
      if (diff < 0) status = 'less';
      
      return {
        kapanNumber,
        ...data,
        status,
        extra: Math.max(0, diff),
        missing: Math.max(0, -diff),
      };
    }).sort((a,b) => parseInt(a.kapanNumber) - parseInt(b.kapanNumber));
  }, [sarinPackets, jiramPackets]);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    const match = barcode.match(/^(?:R)?(\d+)-(\d+)(?:-(.+))?$/);
    if (!match) {
        toast({ variant: 'destructive', title: 'Invalid Barcode Format', description: 'Cannot extract Kapan number from barcode.' });
        return;
    }
    const [, kapanNumber] = match;

    if (jiramPackets.some(p => p.barcode === barcode)) {
        toast({ variant: 'destructive', title: 'Duplicate Scan', description: 'This packet has already been scanned.' });
        return;
    }

    const hasExpectedJiram = sarinPackets.some(p => p.kapanNumber === kapanNumber && (p.jiramCount || 0) > 0);
    if(!hasExpectedJiram) {
        toast({ variant: 'destructive', title: 'No Expected Jiram', description: `No Jiram entries found for Kapan ${kapanNumber} in the Sarin module.`});
    }

    const newPacket: JiramReportPacket = {
      id: uuidv4(),
      barcode,
      kapanNumber,
      scanTime: new Date().toISOString(),
    };

    setJiramPackets([...jiramPackets, newPacket]);
    toast({ title: 'Packet Scanned', description: `Added ${barcode} to Kapan ${kapanNumber}.` });
    setBarcode('');
  };

  const handleDeletePacket = (id: string) => {
    if (window.confirm('Are you sure you want to delete this scanned packet?')) {
      setJiramPackets(jiramPackets.filter(p => p.id !== id));
      toast({ title: 'Scan Deleted' });
    }
  }

  const handleCompleteKapan = (kapanToComplete: string) => {
    // 1. Gather all data for the kapan
    const kapanData = {
        kapanNumber: kapanToComplete,
        sarinPackets: sarinPackets.filter(p => p.kapanNumber === kapanToComplete),
        laserLots: laserLots.filter(l => l.kapanNumber === kapanToComplete),
        jiramReportPackets: jiramPackets.filter(p => p.kapanNumber === kapanToComplete),
        fourPLots: fourPLots.filter(l => l.kapan === kapanToComplete),
        udhdhaPackets: udhdhaPackets.filter(p => getKapanFromIdentifier(p.barcode) === kapanToComplete),
        boxSortingPackets: boxSortingPackets.filter(p => getKapanFromIdentifier(p.packetNumber) === kapanToComplete),
        boxDiameterPackets: boxDiameterPackets.filter(p => getKapanFromIdentifier(p.packetNumber) === kapanToComplete),
    };

    // 2. Trigger JSON download
    try {
      const jsonString = JSON.stringify(kapanData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kapan-${kapanToComplete}-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Backup Downloaded', description: `Data for Kapan ${kapanToComplete} has been saved.` });
    } catch (error) {
      console.error('Backup failed:', error);
      toast({ variant: 'destructive', title: 'Backup Failed', description: 'Could not create the backup file.' });
      return; // Stop if backup fails
    }

    // 3. Delete the data from the database
    setSarinPackets(prev => prev.filter(p => p.kapanNumber !== kapanToComplete));
    setLaserLots(prev => prev.filter(l => l.kapanNumber !== kapanToComplete));
    setJiramPackets(prev => prev.filter(p => p.kapanNumber !== kapanToComplete));
    setFourPLots(prev => prev.filter(l => l.kapan !== kapanToComplete));
    setUdhdhaPackets(prev => prev.filter(p => getKapanFromIdentifier(p.barcode) !== kapanToComplete));
    setBoxSortingPackets(prev => prev.filter(p => getKapanFromIdentifier(p.packetNumber) !== kapanToComplete));
    setBoxDiameterPackets(prev => prev.filter(p => getKapanFromIdentifier(p.packetNumber) !== kapanToComplete));
    
    toast({ title: 'Kapan Completed', description: `All data for Kapan ${kapanToComplete} has been deleted.` });
  };


  const detailedScans = useMemo(() => {
    if (!selectedKapan) return [];
    return jiramPackets.filter(p => p.kapanNumber === selectedKapan).sort((a,b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime());
  }, [jiramPackets, selectedKapan]);
  
  const getStatusIcon = (status: KapanSummary['status']) => {
    switch (status) {
      case 'match': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'extra': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'less': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Jiram Verification Report" description="Verify if created Jiram packets match the expected counts from Sarin entries." />

      <Card>
        <CardHeader>
          <CardTitle>Scan Jiram Packet</CardTitle>
          <CardDescription>Scan the barcode of a packet created from a Jiram piece. The Kapan number will be extracted automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBarcodeScan} className="flex gap-2 max-w-sm">
            <Input
              placeholder="Scan Jiram packet barcode..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
            <Button type="submit" disabled={!barcode}>
              <Barcode className="mr-2 h-4 w-4" /> Scan
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Kapan-wise Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Expected</TableHead><TableHead>Scanned</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {kapanSummary.map(k => (
                    <TableRow key={k.kapanNumber}>
                      <TableCell onClick={() => setSelectedKapan(k.kapanNumber)} className="font-bold cursor-pointer hover:underline">{k.kapanNumber}</TableCell>
                      <TableCell onClick={() => setSelectedKapan(k.kapanNumber)}>{k.expected}</TableCell>
                      <TableCell onClick={() => setSelectedKapan(k.kapanNumber)}>{k.scanned}</TableCell>
                      <TableCell onClick={() => setSelectedKapan(k.kapanNumber)} className="flex items-center gap-2">{getStatusIcon(k.status)} {k.status.charAt(0).toUpperCase() + k.status.slice(1)}</TableCell>
                      <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">Complete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Complete Kapan {k.kapanNumber}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will first download a JSON backup of all data associated with this Kapan across the entire application (Sarin, Laser, etc.).
                                        Then, it will permanently delete all of that data. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCompleteKapan(k.kapanNumber)}>
                                        <Download className="mr-2 h-4 w-4"/>
                                        Backup & Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                   {kapanSummary.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No Jiram data to display.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Performance Chart</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kapanSummary} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kapanNumber" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="expected" fill="hsl(var(--primary))" name="Expected Jiram" />
                <Bar dataKey="scanned" fill="hsl(var(--accent))" name="Actual Scanned" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {selectedKapan && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Scanned Packets for Kapan: {selectedKapan}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedKapan(null)}><XCircle /></Button>
            </div>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader><TableRow><TableHead>Barcode</TableHead><TableHead>Scan Time</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {detailedScans.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.barcode}</TableCell>
                      <TableCell>{format(new Date(p.scanTime), 'PPp')}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePacket(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      )}

    </div>
  );
}


'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { JIRAM_ENTRIES_KEY, KAPANS_KEY, SARIN_PACKETS_KEY } from '@/lib/constants';
import { JiramEntry, Kapan, SarinPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { v4 as uuidv4 } from 'uuid';
import { Barcode, CheckCircle2, AlertTriangle, XCircle, Trash2, Check, CircleSlash, AlertCircle, Upload, Download, ChevronDown, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
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
import { deleteKapanData } from '@/lib/kapan-deleter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


type KapanSummary = {
  kapanNumber: string;
  expected: number;
  scanned: number;
  status: 'match' | 'extra' | 'less';
  extra: number;
  missing: number;
  daysSinceCreation: number;
};

type GroupedScans = {
    date: string;
    count: number;
    packets: JiramEntry[];
};

const KAPAN_COMPLETION_WAIT_DAYS = 20;


export default function JiramReportPage() {
  const { toast } = useToast();
  const [jiramEntries, setJiramEntries] = useLocalStorage<JiramEntry[]>(JIRAM_ENTRIES_KEY, []);
  const [kapans, setKapans] = useLocalStorage<Kapan[]>(KAPANS_KEY, []);
  const [sarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  
  const [barcode, setBarcode] = useState('');
  const [selectedKapan, setSelectedKapan] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [highlightedKapan, setHighlightedKapan] = useState<string | null>(null);
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [lastScannedBarcodes, setLastScannedBarcodes] = useState<string[]>([]);


  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (highlightedKapan) {
      const timer = setTimeout(() => setHighlightedKapan(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedKapan]);
  
  useEffect(() => {
    if (showSuccessTick) {
      const timer = setTimeout(() => setShowSuccessTick(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessTick]);

  const kapanSummary = useMemo((): KapanSummary[] => {
    const kapanData: Record<string, { expected: number; scanned: number; firstDate?: Date; }> = {};

    sarinPackets.forEach(p => {
      if (!kapanData[p.kapanNumber]) {
        kapanData[p.kapanNumber] = { expected: 0, scanned: 0 };
      }
      if (p.jiramCount && p.jiramCount > 0) {
        kapanData[p.kapanNumber].expected += p.jiramCount;
      }
      
      const packetDate = parseISO(p.date);
      if (!kapanData[p.kapanNumber].firstDate || packetDate < kapanData[p.kapanNumber].firstDate!) {
          kapanData[p.kapanNumber].firstDate = packetDate;
      }
    });

    jiramEntries.forEach(p => {
      if (!kapanData[p.kapanNumber]) {
        kapanData[p.kapanNumber] = { expected: 0, scanned: 0 };
      }
      kapanData[p.kapanNumber].scanned += 1;
    });

    const today = startOfDay(new Date());

    return Object.entries(kapanData).map(([kapanNumber, data]) => {
      const diff = data.scanned - data.expected;
      let status: KapanSummary['status'] = 'match';
      if (diff > 0) status = 'extra';
      if (diff < 0) status = 'less';
      
      const daysSinceCreation = data.firstDate ? differenceInDays(today, startOfDay(data.firstDate)) : 0;
      
      return {
        kapanNumber,
        ...data,
        status,
        extra: Math.max(0, diff),
        missing: Math.max(0, -diff),
        daysSinceCreation,
      };
    }).sort((a,b) => parseInt(a.kapanNumber) - parseInt(b.kapanNumber));
  }, [sarinPackets, jiramEntries]);

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    const match = barcode.match(/^(?:R)?(\d+)-(\d+(?:-[A-Z])?)$/);
    if (!match) {
        toast({ variant: 'destructive', title: 'Invalid Barcode Format', description: 'Cannot extract Kapan number from barcode.' });
        setBarcode('');
        return;
    }
    const [, kapanNumber, packetIdentifier] = match;
    const [, suffix] = packetIdentifier.split('-');

    if (jiramEntries.some(p => p.id === barcode)) {
        toast({ variant: 'destructive', title: 'Duplicate Scan', description: 'This packet has already been scanned.' });
        setBarcode('');
        return;
    }

    const hasExpectedJiram = sarinPackets.some(p => p.kapanNumber === kapanNumber && (p.jiramCount || 0) > 0);
    if(!hasExpectedJiram) {
        toast({ variant: 'destructive', title: 'No Expected Jiram', description: `No Jiram entries found for Kapan ${kapanNumber} in the Sarin module.`});
    }

    const newPacket: JiramEntry = {
      id: barcode,
      barcode,
      kapanNumber,
      packetNumber: packetIdentifier,
      suffix: suffix || '',
      scanTime: new Date().toISOString(),
    };
    setJiramEntries(prev => [newPacket, ...prev]);

    const kapanExists = kapans?.some(k => k.kapanNumber === kapanNumber);
    if (!kapanExists) {
        setKapans(prev => [...prev, { id: uuidv4(), kapanNumber }]);
    }
    
    toast({ title: 'Packet Scanned & Queued', description: `Added ${barcode} to Kapan ${kapanNumber} for Chalu entry.` });
    
    setLastScannedBarcodes(prev => [barcode, ...prev].slice(0, 10));
    setBarcode('');
    setHighlightedKapan(kapanNumber);
    setShowSuccessTick(true);
  };

  const handleDeletePacket = (id: string) => {
    setJiramEntries(jiramEntries.filter(p => p.id !== id));
    toast({ title: 'Scan Deleted' });
  }
  
  const handleCompleteKapan = (kapanNumber: string) => {
    deleteKapanData(kapanNumber);

    if (selectedKapan === kapanNumber) {
        setSelectedKapan(null);
    }
    toast({ title: 'Kapan Completed', description: `All associated data for Kapan ${kapanNumber} has been permanently deleted.`});
    
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleExport = () => {
    if (jiramEntries.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'There are no scanned packets to export.' });
      return;
    }
    const dataStr = JSON.stringify(jiramEntries.map(p => ({barcode: p.barcode, kapanNumber: p.kapanNumber})), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jiram-scans.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Successful', description: `${jiramEntries.length} scans exported.` });
  };

  const groupedScans: GroupedScans[] = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filteredPackets = jiramEntries.filter(p => !searchLower || p.barcode.toLowerCase().includes(searchLower));

    const groups: Record<string, JiramEntry[]> = {};
    filteredPackets.forEach(p => {
        const date = format(startOfDay(parseISO(p.scanTime)), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(p);
    });

    return Object.entries(groups)
        .map(([date, packets]) => ({
            date,
            count: packets.length,
            packets: packets.sort((a,b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime())
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [jiramEntries, searchTerm]);

  
  const getStatusIcon = (status: KapanSummary['status']) => {
    switch (status) {
      case 'match': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'extra': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'less': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
        <PageHeader title="Jiram Verification Report" description="Verify if created Jiram packets match the expected counts from Sarin entries." />

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Scan Jiram Packet</CardTitle>
              <CardDescription>Scan the barcode of a packet created from a Jiram piece. The Kapan number will be extracted automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBarcodeScan} className="flex gap-2 max-w-sm relative">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan Jiram packet barcode..."
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                />
                <Button type="submit" disabled={!barcode}>
                  <Barcode className="mr-2 h-4 w-4" /> Scan
                </Button>
                {showSuccessTick && (
                  <div className="absolute right-[-30px] top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                )}
              </form>
               {lastScannedBarcodes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Recent Scans:</p>
                  <div className="flex flex-wrap gap-2">
                    {lastScannedBarcodes.map((b, i) => (
                       <Badge key={i} variant={i === 0 ? 'default' : 'secondary'} className="font-mono">{b}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performance Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kapanSummary} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kapanNumber" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="expected" fill="hsl(var(--primary))" name="Expected Jiram" />
                  <Bar dataKey="scanned" fill="hsl(var(--accent))" name="Actual Scanned" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>Kapan-wise Summary</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Scans
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Expected</TableHead><TableHead>Scanned</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {kapanSummary.map(k => {
                      const daysRemaining = KAPAN_COMPLETION_WAIT_DAYS - k.daysSinceCreation;
                      const canComplete = daysRemaining <= 0;
                      return (
                      <TableRow key={k.kapanNumber} className={cn("group transition-colors", highlightedKapan === k.kapanNumber && 'bg-yellow-100 dark:bg-yellow-900/30')}>
                        <TableCell className="font-bold">{k.kapanNumber}</TableCell>
                        <TableCell>{k.expected}</TableCell>
                        <TableCell>{k.scanned}</TableCell>
                        <TableCell className="flex items-center gap-2">{getStatusIcon(k.status)} {k.status.charAt(0).toUpperCase() + k.status.slice(1)}</TableCell>
                        <TableCell>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                  <span tabIndex={0}> {/* Wrapper for disabled button */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={!canComplete}>
                                          <Check className="mr-2 h-4 w-4" /> Complete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="text-destructive"/>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action will permanently delete all data associated with <strong>Kapan {k.kapanNumber}</strong> from the entire application, including Sarin, Laser, 4P, and Udhda entries. This is to free up storage and cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleCompleteKapan(k.kapanNumber)}>
                                            Yes, Delete All Data for Kapan {k.kapanNumber}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </span>
                              </TooltipTrigger>
                              {!canComplete && (
                                <TooltipContent>
                                  <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {daysRemaining} days remaining until completion is allowed.</p>
                                </TooltipContent>
                              )}
                           </Tooltip>
                        </TableCell>
                      </TableRow>
                    )})}
                    {kapanSummary.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No Jiram data to display.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date-wise Scanned Packets</CardTitle>
              <div className="pt-4">
                <Input
                  placeholder="Search by packet barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto pr-2">
              <div className="space-y-4">
                  {groupedScans.map(group => (
                    <Collapsible key={group.date} className="border-b">
                      <CollapsibleTrigger className="flex justify-between items-center w-full py-2 font-semibold">
                        <div className="flex items-center gap-2">
                              {format(parseISO(group.date), 'PPP')}
                              <Badge>{group.count}</Badge>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]>svg]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Kapan</TableHead>
                                <TableHead>Scan Time</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.packets.map(p => (
                                <TableRow key={p.id}>
                                  <TableCell className="font-mono">{p.barcode}</TableCell>
                                  <TableCell>{p.kapanNumber}</TableCell>
                                  <TableCell>{format(new Date(p.scanTime), 'p')}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeletePacket(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                  {groupedScans.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No packets match your search.</p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}


'use client';
import React, { useState, useMemo } from 'react';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { SARIN_PACKETS_KEY, REASSIGN_LOGS_KEY } from '@/lib/constants';
import { SarinPacket, ReassignLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight } from 'lucide-react';

export default function LotAnalysisPage() {
  const [sarinPackets] = useSyncedStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [reassignLogs] = useSyncedStorage<ReassignLog[]>(REASSIGN_LOGS_KEY, []);
  const [searchTerm, setSearchTerm] = useState('');

  const lotData = useMemo(() => {
    if (!searchTerm) return null;

    const packetsInLot = sarinPackets.filter(p => p.lotNumber === searchTerm);
    if (packetsInLot.length === 0) return { notFound: true };

    const firstPacket = packetsInLot[0];
    const totalEntries = packetsInLot.length;
    const totalMainPacketCount = packetsInLot.reduce((sum, p) => sum + p.mainPacketNumber, 0);
    const totalPacketCount = packetsInLot.reduce((sum, p) => sum + p.packetCount, 0);
    const totalJiram = packetsInLot.reduce((sum, p) => sum + (p.jiramCount || 0), 0);
    const isReturned = packetsInLot.some(p => p.isReturned);
    const returnEntry = packetsInLot.find(p => p.isReturned);
    
    const relevantLogs = reassignLogs
      .filter(log => log.packets.some(p => p.lotNumber === searchTerm))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalEntries,
      totalMainPacketCount,
      totalPacketCount,
      totalJiram,
      isReturned,
      kapanNumber: firstPacket?.kapanNumber || 'N/A',
      operator: firstPacket?.operator || 'N/A',
      entryDate: firstPacket?.date ? format(new Date(firstPacket.date), 'PPp') : 'N/A',
      returnDate: returnEntry?.returnDate ? format(new Date(returnEntry.returnDate), 'PPp') : 'N/A',
      returnedBy: returnEntry?.returnedBy || 'N/A',
      notFound: false,
      reassignmentHistory: relevantLogs,
    };
  }, [searchTerm, sarinPackets, reassignLogs]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Lot Analysis (Sarin)" description="Search for a lot to see detailed analysis and reassignment history." />
      <div className="flex gap-2 mb-6 max-w-sm">
        <Input 
          placeholder="Enter Lot Number..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {lotData && !lotData.notFound && (
        <div className="space-y-6">
            <Card id="lot-analysis-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Analysis for Lot: {searchTerm}</CardTitle>
                    <CardDescription>
                      <Badge variant={lotData.isReturned ? 'secondary' : 'destructive'} className="mt-2">
                        {lotData.isReturned ? 'Returned' : 'Not Returned'}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button onClick={handlePrint} variant="outline">Print / Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="font-medium">Kapan Number:</div>
                  <div>{lotData.kapanNumber}</div>

                  <div className="font-medium">Original Operator:</div>
                  <div>{lotData.operator}</div>
                  
                  <div className="font-medium">Total Entries:</div>
                  <div>{lotData.totalEntries}</div>
                  
                  <div className="font-medium">Total Main Packet Count:</div>
                  <div>{lotData.totalMainPacketCount}</div>

                  <div className="font-medium">Total Packet Count:</div>
                  <div>{lotData.totalPacketCount}</div>

                  <div className="font-medium">Total Jiram:</div>
                  <div>{lotData.totalJiram}</div>
                  
                  <div className="font-medium">Entry Date:</div>
                  <div>{lotData.entryDate}</div>

                  {lotData.isReturned && (
                    <>
                      <div className="font-medium">Return Date:</div>
                      <div>{lotData.returnDate}</div>
                      <div className="font-medium">Returned By:</div>
                      <div>{lotData.returnedBy}</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {lotData.reassignmentHistory.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Reassignment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Packets Transferred</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lotData.reassignmentHistory.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.fromOperator}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                <span>{log.toOperator}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {log.packets.find(p => p.lotNumber === searchTerm)?.quantityTransferred}
                                        </TableCell>
                                        <TableCell>{format(new Date(log.date), 'PPp')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
      )}
      
      {lotData?.notFound && (
        <p className="text-muted-foreground">No data found for lot number "{searchTerm}".</p>
      )}
    </div>
  );
}


'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { LASER_LOTS_KEY } from '@/lib/constants';
import { LaserLot } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function LaserLotAnalysisPage() {
  const [laserLots] = useSyncedStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedTerm, setSearchedTerm] = useState('');
  const [matchingLots, setMatchingLots] = useState<LaserLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<LaserLot | null>(null);

  useEffect(() => {
    if (searchedTerm) {
      const allMatches = laserLots
        .filter(l => l.lotNumber === searchedTerm)
        .sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
      
      setMatchingLots(allMatches);
      setSelectedLot(allMatches[0] || null); // Select the most recent one by default
    } else {
      setMatchingLots([]);
      setSelectedLot(null);
    }
  }, [searchedTerm, laserLots]);
  
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setSearchedTerm(searchTerm);
  };


  const lotData = useMemo(() => {
    if (!selectedLot) return null;

    return {
      ...selectedLot,
      entryDateFormatted: selectedLot.entryDate ? format(new Date(selectedLot.entryDate), 'PPp') : 'N/A',
      returnDateFormatted: selectedLot.returnDate ? format(new Date(selectedLot.returnDate), 'PPp') : 'N/A',
    };
  }, [selectedLot]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Lot Analysis (Laser)" description="Search for a lot to see detailed analysis and scanned packets." />
      <div className="flex gap-2 mb-6 max-w-sm">
        <form onSubmit={handleSearch} className="flex gap-2 w-full">
            <Input 
              placeholder="Enter Lot Number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
             <Button type="submit" disabled={!searchTerm}>Search</Button>
        </form>
      </div>
      
      {searchedTerm && (
        <div className="space-y-6">
            {matchingLots.length > 0 ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>Found Lot "{searchedTerm}" in:</CardTitle>
                        <CardDescription>Select a Kapan to view its details. The most recent is shown by default.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {matchingLots.map(lot => (
                             <Button
                                key={lot.id}
                                variant={selectedLot?.id === lot.id ? 'default' : 'outline'}
                                onClick={() => setSelectedLot(lot)}
                             >
                                 Kapan {lot.kapanNumber} ({format(new Date(lot.entryDate), 'MMM d')})
                             </Button>
                        ))}
                    </CardContent>
                 </Card>
            ) : (
                <p className="text-muted-foreground">No data found for lot number "{searchTerm}".</p>
            )}

            {lotData && (
                <div className="space-y-6">
                    <Card id="lot-analysis-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Analysis for Lot: {searchedTerm} (Kapan: {lotData.kapanNumber})</CardTitle>
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
                          
                          <div className="font-medium">Tension Type:</div>
                          <div>{lotData.tensionType}</div>
                          
                          <div className="font-medium">Machine:</div>
                          <div>{lotData.machine}</div>

                          <div className="font-medium">Total Packet Count:</div>
                          <div>{lotData.packetCount}</div>
                          
                          <div className="font-medium">Entry Date:</div>
                          <div>{lotData.entryDateFormatted}</div>

                          {lotData.isReturned && (
                            <>
                              <div className="font-medium">Return Date:</div>
                              <div>{lotData.returnDateFormatted}</div>
                              <div className="font-medium">Returned By:</div>
                              <div>{lotData.returnedBy}</div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Scanned Packets on Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Full Barcode</TableHead>
                                        <TableHead>Kapan #</TableHead>
                                        <TableHead>Packet #</TableHead>
                                        <TableHead>Suffix</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lotData.scannedPackets?.map((p, i) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell>{p.fullBarcode}</TableCell>
                                            <TableCell>{p.kapanNumber}</TableCell>
                                            <TableCell>{p.packetNumber}</TableCell>
                                            <TableCell>{p.suffix}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {(!lotData.scannedPackets || lotData.scannedPackets.length === 0) && (
                                <p className="text-center text-muted-foreground p-4">No scanned packets found for this lot.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
      )}
    </div>
  );
}


'use client';
import React, { useState, useMemo } from 'react';
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

export default function LaserLotAnalysisPage() {
  const [laserLots] = useSyncedStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [searchTerm, setSearchTerm] = useState('');

  const lotData = useMemo(() => {
    if (!searchTerm) return null;

    const lot = laserLots.find(l => l.lotNumber === searchTerm);
    if (!lot) return { notFound: true };

    return {
      ...lot,
      entryDateFormatted: lot.entryDate ? format(new Date(lot.entryDate), 'PPp') : 'N/A',
      returnDateFormatted: lot.returnDate ? format(new Date(lot.returnDate), 'PPp') : 'N/A',
      notFound: false,
    };
  }, [searchTerm, laserLots]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Lot Analysis (Laser)" description="Search for a lot to see detailed analysis and scanned packets." />
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
                    <CardTitle>Scanned Packets</CardTitle>
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
      
      {lotData?.notFound && (
        <p className="text-muted-foreground">No data found for lot number "{searchTerm}".</p>
      )}
    </div>
  );
}

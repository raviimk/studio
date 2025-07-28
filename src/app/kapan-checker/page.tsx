
'use client';

import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY, LASER_LOTS_KEY, UHDHA_PACKETS_KEY } from '@/lib/constants';
import { SarinPacket, LaserLot, UdhdaPacket } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, History, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

type PacketInfo = {
  id: string;
  identifier: string; // Could be barcode or lot number
  source: 'Sarin' | 'Laser' | 'Udhda';
  operator: string;
  timestamp: string;
  status: 'Returned' | 'Running';
};

// Helper to extract kapan number from various formats
const getKapanFromIdentifier = (identifier: string): string | null => {
  const match = identifier.match(/^(?:R)?(\d+)/);
  return match ? match[1] : null;
};

// Helper to normalize a packet barcode for searching
const normalizeBarcode = (barcode: string): string => {
  return barcode.toUpperCase().startsWith('R') ? barcode.substring(1) : barcode;
};


export default function KapanCheckerPage() {
  const [sarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [udhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchedTerm, setSearchedTerm] = useState<string | null>(null);

  const kapanData = useMemo(() => {
    if (!searchedTerm) return [];
    
    let results: PacketInfo[] = [];
    const normalizedSearchTerm = normalizeBarcode(searchedTerm);
    const searchIsKapanOnly = /^\d+$/.test(searchedTerm);

    // Process Sarin Packets
    sarinPackets.forEach(p => {
        const sarinIdentifier = `${p.kapanNumber}-${p.mainPacketNumber}`;
        const matchesKapan = searchIsKapanOnly && p.kapanNumber === searchedTerm;
        const matchesIdentifier = !searchIsKapanOnly && sarinIdentifier === normalizedSearchTerm;

        if (matchesKapan || matchesIdentifier) {
            results.push({
                id: p.id,
                identifier: sarinIdentifier,
                source: 'Sarin',
                operator: p.operator,
                timestamp: p.date,
                status: p.isReturned ? 'Returned' : 'Running'
            });
        }
    });

    // Process Laser Lots (and their individual packets)
    laserLots.forEach(lot => {
        lot.scannedPackets?.forEach(p => {
            const matchesKapan = searchIsKapanOnly && lot.kapanNumber === searchedTerm;
            const matchesIdentifier = !searchIsKapanOnly && normalizeBarcode(p.fullBarcode) === normalizedSearchTerm;

             if (matchesKapan || matchesIdentifier) {
                results.push({
                    id: p.id,
                    identifier: p.fullBarcode,
                    source: 'Laser',
                    operator: lot.returnedBy || lot.machine,
                    timestamp: lot.entryDate,
                    status: lot.isReturned ? 'Returned' : 'Running'
                });
            }
        });
    });

    // Process Udhda Packets
    udhdhaPackets.forEach(p => {
        const kapan = getKapanFromIdentifier(p.barcode);
        const matchesKapan = searchIsKapanOnly && kapan === searchedTerm;
        const matchesIdentifier = !searchIsKapanOnly && normalizeBarcode(p.barcode) === normalizedSearchTerm;
        
        if (matchesKapan || matchesIdentifier) {
            results.push({
                id: p.id,
                identifier: p.barcode,
                source: 'Udhda',
                operator: p.operator,
                timestamp: p.assignmentTime,
                status: p.isReturned ? 'Returned' : 'Running'
            });
        }
    });
    
    return results.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  }, [searchedTerm, sarinPackets, laserLots, udhdhaPackets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedTerm(searchTerm);
  };

  const getStatusIcon = (status: 'Returned' | 'Running') => {
      if (status === 'Returned') {
          return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      }
      return <History className="h-5 w-5 text-yellow-500" />;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Kapan Checker" description="Check the status of all packets associated with a Kapan or Packet number." />
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Search Kapan or Packet</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              placeholder="Enter Kapan or Packet Number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Button type="submit" disabled={!searchTerm}>
              <Search className="mr-2" /> Search
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {searchedTerm && (
        <Card>
          <CardHeader>
            <CardTitle>Results for: {searchedTerm}</CardTitle>
             <div className="pt-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input 
                    placeholder="Enter new Kapan or Packet Number..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" disabled={!searchTerm}>
                    <Search className="mr-2" /> Search
                    </Button>
                </form>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Identifier</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {kapanData.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-mono">{item.identifier}</TableCell>
                                <TableCell><Badge variant={item.source === 'Sarin' ? 'default' : item.source === 'Laser' ? 'secondary' : 'outline'}>{item.source}</Badge></TableCell>
                                <TableCell>{item.operator}</TableCell>
                                <TableCell>{format(new Date(item.timestamp), 'PPp')}</TableCell>
                                <TableCell className="flex items-center gap-2">
                                    {getStatusIcon(item.status)}
                                    <span>{item.status}</span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {kapanData.length === 0 && (
                <p className="text-center text-muted-foreground p-6">No packets found for "{searchedTerm}".</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

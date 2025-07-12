
'use client';
import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UHDHA_PACKETS_KEY } from '@/lib/constants';
import { UdhdaPacket } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/PageHeader';
import { format, formatDistance } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function UdhdaReportPage() {
  const [udhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
  const [searchTerm, setSearchTerm] = useState('');

  const sortedPackets = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return [...udhdhaPackets]
      .filter(p => !searchTerm || p.barcode.toLowerCase().includes(searchLower))
      .sort((a, b) => new Date(b.assignmentTime).getTime() - new Date(a.assignmentTime).getTime());
  }, [udhdhaPackets, searchTerm]);

  const getDuration = (start: string, end?: string) => {
    if (!end) return 'Pending';
    return formatDistance(new Date(end), new Date(start));
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Udhda Packet Report" description="View the history of all individual packet assignments." />
      <Card>
        <CardHeader>
          <CardTitle>Packet Log</CardTitle>
          <CardDescription>A complete log of all Udhda packet movements.</CardDescription>
            <div className="pt-4">
                <Input
                    placeholder="Search by packet barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assignment Time</TableHead>
                  <TableHead>Return Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPackets.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.barcode}</TableCell>
                    <TableCell>{p.operator}</TableCell>
                    <TableCell>{p.type}</TableCell>
                    <TableCell>{format(new Date(p.assignmentTime), 'PPp')}</TableCell>
                    <TableCell>{p.returnTime ? format(new Date(p.returnTime), 'PPp') : 'N/A'}</TableCell>
                    <TableCell>{getDuration(p.assignmentTime, p.returnTime)}</TableCell>
                    <TableCell>
                      <Badge variant={p.isReturned ? 'secondary' : 'destructive'}>
                        {p.isReturned ? 'Returned' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {sortedPackets.length === 0 && (
                   <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No Udhda packet entries found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

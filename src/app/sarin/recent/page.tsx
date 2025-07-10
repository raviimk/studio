'use client';
import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY } from '@/lib/constants';
import { SarinPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function RecentSarinEntriesPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setSarinPackets(sarinPackets.filter(p => p.id !== id));
      toast({ title: 'Success', description: 'Sarin packet entry deleted.' });
    }
  };

  const sortedPackets = React.useMemo(() => {
    return [...sarinPackets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Recent Sarin Entries" description="View all created Sarin packets." />
      <Card>
        <CardHeader><CardTitle>All Sarin Packets</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Lot #</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Kapan #</TableHead>
                  <TableHead>Main Packet #</TableHead>
                  <TableHead>Packets</TableHead>
                  <TableHead>Jiram</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPackets.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.operator}</TableCell>
                    <TableCell>{p.lotNumber}</TableCell>
                    <TableCell>{p.machine}</TableCell>
                    <TableCell>{p.kapanNumber}</TableCell>
                    <TableCell>{p.mainPacketNumber}</TableCell>
                    <TableCell>{p.packetCount}</TableCell>
                    <TableCell>{p.jiramCount || 0}</TableCell>
                    <TableCell>{format(new Date(p.date), 'PPp')}</TableCell>
                    <TableCell>
                      <Badge variant={p.isReturned ? 'secondary' : 'destructive'}>
                        {p.isReturned ? 'Returned' : 'Not Returned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sortedPackets.length === 0 && <p className="text-center text-muted-foreground p-4">No entries found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';
import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY } from '@/lib/constants';
import { LaserLot } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function RecentLaserEntriesPage() {
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setLaserLots(laserLots.filter(lot => lot.id !== id));
      toast({ title: 'Success', description: 'Laser lot entry deleted.' });
    }
  };
  
  const sortedLots = React.useMemo(() => {
    return [...laserLots].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [laserLots]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Recent Laser Entries" description="View all created laser lots." />
      <Card>
        <CardHeader><CardTitle>All Laser Lots</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot No.</TableHead>
                <TableHead>Kapan No.</TableHead>
                <TableHead>Tension</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Packets</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLots.map(lot => (
                <TableRow key={lot.id}>
                  <TableCell>{lot.lotNumber}</TableCell>
                  <TableCell>{lot.kapanNumber}</TableCell>
                  <TableCell>{lot.tensionType}</TableCell>
                  <TableCell>{lot.machine}</TableCell>
                  <TableCell>{lot.packetCount}</TableCell>
                  <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                  <TableCell>
                    <Badge variant={lot.isReturned ? 'secondary' : 'destructive'}>
                      {lot.isReturned ? `Returned by ${lot.returnedBy}` : 'Not Returned'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {sortedLots.length === 0 && <p className="text-center text-muted-foreground p-4">No entries found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

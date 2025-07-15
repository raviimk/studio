
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface GroupedPacket {
    barcode: string;
    returnCount: number;
    latestOperator: string;
    latestStatus: 'Returned' | 'Pending';
    history: UdhdaPacket[];
}

export default function UdhdaReportPage() {
  const [udhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
  const [searchTerm, setSearchTerm] = useState('');

  const groupedPackets = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const groups: Record<string, GroupedPacket> = {};
    
    const sortedHistory = [...udhdhaPackets].sort((a,b) => new Date(a.assignmentTime).getTime() - new Date(b.assignmentTime).getTime());

    sortedHistory.forEach(packet => {
        if (!groups[packet.barcode]) {
            groups[packet.barcode] = {
                barcode: packet.barcode,
                returnCount: 0,
                latestOperator: '',
                latestStatus: 'Pending',
                history: []
            };
        }
        groups[packet.barcode].history.push(packet);
        if (packet.isReturned) {
            groups[packet.barcode].returnCount++;
        }
    });

    return Object.values(groups)
      .map(group => {
          const latestEntry = group.history[group.history.length - 1];
          group.latestOperator = latestEntry.operator;
          group.latestStatus = latestEntry.isReturned ? 'Returned' : 'Pending';
          return group;
      })
      .filter(g => !searchTerm || g.barcode.toLowerCase().includes(searchLower))
      .sort((a, b) => b.history[0].assignmentTime.localeCompare(a.history[0].assignmentTime));
  }, [udhdhaPackets, searchTerm]);

  const getDuration = (start: string, end?: string) => {
    if (!end) return 'Pending';
    return formatDistance(new Date(end), new Date(start));
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Udhda Packet Report" description="View the complete history and return count of all individual packets." />
      <Card>
        <CardHeader>
          <CardTitle>Packet Log</CardTitle>
          <CardDescription>A complete log of all Udhda packet movements, grouped by barcode.</CardDescription>
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
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Return Count</TableHead>
                  <TableHead>Latest Operator</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedPackets.map(group => (
                  <Collapsible asChild key={group.barcode}>
                    <>
                      <TableRow className="bg-muted/30 hover:bg-muted/60">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]>svg]:rotate-180" />
                                <span className="sr-only">Toggle history</span>
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-mono font-bold">{group.barcode}</TableCell>
                        <TableCell><Badge variant="outline">{group.returnCount}</Badge></TableCell>
                        <TableCell>{group.latestOperator}</TableCell>
                        <TableCell>
                          <Badge variant={group.latestStatus === 'Returned' ? 'secondary' : 'destructive'}>
                            {group.latestStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                         <tr className="bg-background">
                            <td colSpan={5} className="p-0">
                                <div className="p-4">
                                     <h4 className="text-sm font-semibold mb-2">History for {group.barcode}</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Operator</TableHead>
                                                <TableHead>Assignment Time</TableHead>
                                                <TableHead>Return Time</TableHead>
                                                <TableHead>Duration</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.history.map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{p.operator}</TableCell>
                                                    <TableCell>{format(new Date(p.assignmentTime), 'PPp')}</TableCell>
                                                    <TableCell>{p.returnTime ? format(new Date(p.returnTime), 'PPp') : 'N/A'}</TableCell>
                                                    <TableCell>{getDuration(p.assignmentTime, p.returnTime)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </td>
                         </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
                 {groupedPackets.length === 0 && (
                   <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No Udhda packet entries found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

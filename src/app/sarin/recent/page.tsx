
'use client';
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SARIN_PACKETS_KEY } from '@/lib/constants';
import { SarinPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Save, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function RecentSarinEntriesPage() {
  const [sarinPackets, setSarinPackets] = useLocalStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const { toast } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SarinPacket>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setSarinPackets(sarinPackets.filter(p => p.id !== id));
      toast({ title: 'Success', description: 'Sarin packet entry deleted.' });
    }
  };

  const handleEdit = (packet: SarinPacket) => {
    setEditingId(packet.id);
    setEditFormData({
        mainPacketNumber: packet.mainPacketNumber,
        packetCount: packet.packetCount,
        jiramCount: packet.jiramCount
    });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = (id: string) => {
    setSarinPackets(prev => prev.map(p => {
        if (p.id === id) {
            return {
                ...p,
                mainPacketNumber: editFormData.mainPacketNumber ?? p.mainPacketNumber,
                packetCount: editFormData.packetCount ?? p.packetCount,
                jiramCount: editFormData.jiramCount ?? p.jiramCount
            };
        }
        return p;
    }));
    toast({ title: 'Success', description: 'Entry updated successfully.' });
    handleCancelEdit();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: name === 'jiramCount' ? (value ? parseInt(value, 10) : undefined) : parseInt(value, 10) }));
  };

  const sortedPackets = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = sarinPackets.filter(p =>
      !searchLower || p.lotNumber.toLowerCase().includes(searchLower)
    );
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sarinPackets, searchTerm]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Recent Sarin Entries" description="View, search, and edit all created Sarin packets." />
      <Card>
        <CardHeader>
          <CardTitle>All Sarin Packets</CardTitle>
          <div className="pt-4">
              <Input
                  placeholder="Search by Lot Number..."
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
                  <TableHead>Operator</TableHead>
                  <TableHead>Lot #</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Kapan #</TableHead>
                  <TableHead>Main Packet Count</TableHead>
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
                    <TableCell>
                      {editingId === p.id ? (
                        <Input type="number" name="mainPacketNumber" value={editFormData.mainPacketNumber || ''} onChange={handleInputChange} className="h-8 w-20" />
                      ) : (
                        p.mainPacketNumber
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === p.id ? (
                        <Input type="number" name="packetCount" value={editFormData.packetCount || ''} onChange={handleInputChange} className="h-8 w-20" />
                      ) : (
                        p.packetCount
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === p.id ? (
                        <Input type="number" name="jiramCount" value={editFormData.jiramCount || ''} onChange={handleInputChange} className="h-8 w-20" />
                      ) : (
                        p.jiramCount || 0
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(p.date), 'PPp')}</TableCell>
                    <TableCell>
                      <Badge variant={p.isReturned ? 'secondary' : 'destructive'}>
                        {p.isReturned ? 'Returned' : 'Not Returned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingId === p.id ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(p.id)}><Save className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4 text-red-600" /></Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} disabled={p.isReturned}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
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

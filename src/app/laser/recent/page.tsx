
'use client';
import React, { useState, useMemo } from 'react';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { LASER_LOTS_KEY, LASER_MAPPINGS_KEY } from '@/lib/constants';
import { LaserLot, LaserMapping } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Save, Trash2, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RecentLaserEntriesPage() {
  const [laserLots, setLaserLots] = useSyncedStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserMappings] = useSyncedStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<LaserLot>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setLaserLots(laserLots.filter(lot => lot.id !== id));
      toast({ title: 'Success', description: 'Laser lot entry deleted.' });
    }
  };

  const handleEdit = (lot: LaserLot) => {
    setEditingId(lot.id);
    setEditFormData({
        lotNumber: lot.lotNumber,
        kapanNumber: lot.kapanNumber,
        packetCount: lot.packetCount,
        tensionType: lot.tensionType,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = (id: string) => {
    const machine = laserMappings.find(m => m.tensionType === editFormData.tensionType)?.machine || 'N/A';

    setLaserLots(prev => prev.map(p => {
        if (p.id === id) {
            return {
                ...p,
                ...editFormData,
                machine,
            };
        }
        return p;
    }));
    toast({ title: 'Success', description: 'Entry updated successfully.' });
    handleCancelEdit();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: name === 'packetCount' ? parseInt(value, 10) : value }));
  };
  
  const handleSelectChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, tensionType: value }));
  };

  const sortedLots = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = laserLots.filter(p =>
      !searchLower || p.lotNumber.toLowerCase().includes(searchLower) || p.kapanNumber.toLowerCase().includes(searchLower)
    );
    return filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [laserLots, searchTerm]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader title="Recent Laser Entries" description="View, search, and edit all created laser lots." />
      <Card>
        <CardHeader>
            <CardTitle>All Laser Lots</CardTitle>
            <div className="pt-4">
              <Input
                  placeholder="Search by Lot or Kapan Number..."
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
                    {editingId === lot.id ? (
                        <>
                            <TableCell><Input name="lotNumber" value={editFormData.lotNumber} onChange={handleInputChange} className="h-8 w-24" /></TableCell>
                            <TableCell><Input name="kapanNumber" value={editFormData.kapanNumber} onChange={handleInputChange} className="h-8 w-24" /></TableCell>
                            <TableCell>
                                <Select value={editFormData.tensionType} onValueChange={handleSelectChange}>
                                    <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {laserMappings.map(m => <SelectItem key={m.id} value={m.tensionType}>{m.tensionType}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>{laserMappings.find(m => m.tensionType === editFormData.tensionType)?.machine || 'N/A'}</TableCell>
                            <TableCell><Input type="number" name="packetCount" value={editFormData.packetCount} onChange={handleInputChange} className="h-8 w-20" /></TableCell>
                            <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                            <TableCell>
                                <Badge variant={lot.isReturned ? 'secondary' : 'destructive'}>
                                {lot.isReturned ? `Returned by ${lot.returnedBy}` : 'Not Returned'}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(lot.id)}><Save className="h-4 w-4 text-green-600" /></Button>
                                <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4 text-red-600" /></Button>
                            </TableCell>
                        </>
                    ) : (
                        <>
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
                            <TableCell className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(lot)} disabled={lot.isReturned}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(lot.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </>
                    )}
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {sortedLots.length === 0 && <p className="text-center text-muted-foreground p-4">No entries found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

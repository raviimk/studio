
'use client';
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LASER_LOTS_KEY, LASER_OPERATORS_KEY } from '@/lib/constants';
import { LaserLot, LaserOperator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function ReturnLaserLotPage() {
  const [laserLots, setLaserLots] = useLocalStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [returningOperator, setReturningOperator] = useState('');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const unreturnedLots = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return laserLots.filter(lot => {
        if (lot.isReturned) return false;
        
        if (!searchTerm) return true;
        
        return lot.lotNumber.toLowerCase().includes(searchLower) ||
               lot.kapanNumber.toLowerCase().includes(searchLower) ||
               lot.tensionType.toLowerCase().includes(searchLower);
    }).sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [laserLots, searchTerm]);


  const handleReturnLot = (lotToReturn: LaserLot) => {
    if (!returningOperator) {
        toast({ variant: 'destructive', title: 'Operator Not Selected', description: 'Please select the operator who is returning the lot.' });
        return;
    }

    const updatedLots = laserLots.map(lot =>
      lot.id === lotToReturn.id
        ? { ...lot, isReturned: true, returnedBy: returningOperator, returnDate: new Date().toISOString() }
        : lot
    );
    setLaserLots(updatedLots);
    toast({ title: 'Success', description: 'Lot has been marked as returned.' });
  };


  return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <PageHeader title="Return Laser Lot" description="Mark laser lots as returned after packet verification." />
        <Card>
          <CardHeader>
              <CardTitle>Unreturned Lots</CardTitle>
               <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <Input
                      placeholder="Search by Lot, Kapan, or Tension..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                  />
                  <Select onValueChange={setReturningOperator} value={returningOperator}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select Returning Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {laserOperators.map(op => (
                        <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Lot No.</TableHead>
                    <TableHead>Kapan No.</TableHead>
                    <TableHead>Tension</TableHead>
                    <TableHead>Packets</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unreturnedLots.map(lot => (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.lotNumber}</TableCell>
                      <TableCell>{lot.kapanNumber}</TableCell>
                      <TableCell>{lot.tensionType}</TableCell>
                      <TableCell>{lot.packetCount}</TableCell>
                      <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button disabled={!returningOperator}>Return Lot</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Lot Return</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Are you sure you want to return Lot <span className="font-bold">{lot.lotNumber}</span>? 
                                  This will be marked as returned by <span className="font-bold">{returningOperator}</span>.
                                  This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleReturnLot(lot)}>Confirm Return</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {unreturnedLots.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                            No unreturned lots found.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}

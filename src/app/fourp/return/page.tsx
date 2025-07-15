
'use client';
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_OPERATORS_KEY, PRICE_MASTER_KEY } from '@/lib/constants';
import { FourPLot, FourPOperator, PriceMaster } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FourPReturnPage() {
  const { toast } = useToast();
  const [fourPTechingLots, setFourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [fourPOperators] = useLocalStorage<FourPOperator[]>(FOURP_OPERATORS_KEY, []);
  const [priceMaster] = useLocalStorage<PriceMaster>(PRICE_MASTER_KEY, { fourP: 0, fourPTeching: 0 });

  const [selectedOperator, setSelectedOperator] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleReturnLot = (lotId: string) => {
     if (!selectedOperator) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a 4P operator.' });
      return;
    }

    const lotToReturn = fourPTechingLots.find(lot => lot.id === lotId);
    if (!lotToReturn) {
      toast({ variant: 'destructive', title: 'Error', description: 'Lot not found.' });
      return;
    }

    const fourPAmount = (lotToReturn.finalPcs || 0) * priceMaster.fourP;
    
    const updatedLots = fourPTechingLots.map(lot =>
      lot.id === lotId
        ? {
            ...lot,
            isReturnedToFourP: true,
            fourPOperator: selectedOperator,
            fourPAmount,
            returnDate: new Date().toISOString(),
          }
        : lot
    );
    setFourPTechingLots(updatedLots);
    toast({ title: `Lot Returned`, description: `Assigned to ${selectedOperator}. Amount: ₹${fourPAmount.toFixed(2)}` });
  };
  
  const unreturnedLots = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return fourPTechingLots.filter(lot => {
        if (lot.isReturnedToFourP) return false;
        if (!searchTerm) return true;
        return lot.lot.toLowerCase().includes(searchLower) ||
               lot.kapan.toLowerCase().includes(searchLower);
    });
  }, [fourPTechingLots, searchTerm]);

  const returnedLots = useMemo(() => {
    return fourPTechingLots
      .filter(lot => lot.isReturnedToFourP)
      .sort((a,b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime());
  }, [fourPTechingLots]);


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="4P Return" description="Process the return of lots from 4P operators." />

      <Card>
        <CardHeader>
            <CardTitle>Lots Pending 4P Return</CardTitle>
            <div className='pt-4 grid md:grid-cols-2 gap-4'>
                <div>
                    <Label htmlFor="search-lot">Search Lot or Kapan</Label>
                    <Input
                        id="search-lot"
                        placeholder="Enter lot or kapan number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="4p-operator-select">Select 4P Operator to Assign Return</Label>
                    <Select onValueChange={setSelectedOperator} value={selectedOperator}>
                        <SelectTrigger id="4p-operator-select" className="mt-1">
                            <SelectValue placeholder="Select 4P Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            {fourPOperators.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Final PCS</TableHead><TableHead>4P Amount (₹)</TableHead><TableHead>Teching Operator</TableHead><TableHead>Entry Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {unreturnedLots.map(lot => {
                  const fourPAmount = (lot.finalPcs || 0) * priceMaster.fourP;
                  return (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                    <TableCell className="font-bold text-green-600">₹{fourPAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{lot.techingOperator}</Badge></TableCell>
                    <TableCell>{format(new Date(lot.entryDate), 'PPp')}</TableCell>
                    <TableCell>
                       <Button onClick={() => handleReturnLot(lot.id)} disabled={!selectedOperator}>Return to 4P</Button>
                    </TableCell>
                  </TableRow>
                )})}
                {unreturnedLots.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No lots are pending return.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader><CardTitle>Recently Returned Lots</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Kapan</TableHead><TableHead>Lot</TableHead><TableHead>Total PCS</TableHead><TableHead>Blocking</TableHead><TableHead>Final PCS</TableHead><TableHead>4P Operator</TableHead><TableHead>4P Amount (₹)</TableHead><TableHead>Return Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {returnedLots.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell>{lot.pcs}</TableCell>
                    <TableCell className="text-destructive font-medium">{lot.blocking || 0}</TableCell>
                    <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                    <TableCell><Badge>{lot.fourPOperator}</Badge></TableCell>
                    <TableCell>₹{lot.fourPAmount?.toFixed(2)}</TableCell>
                    <TableCell>{lot.returnDate ? format(new Date(lot.returnDate), 'PPp') : 'N/A'}</TableCell>
                  </TableRow>
                ))}
                 {returnedLots.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No lots returned yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

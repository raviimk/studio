
'use client';
import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { UHDHA_PACKETS_KEY } from '@/lib/constants';
import { UdhdaPacket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import { Barcode, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

type ScanResult = {
    status: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    packet?: UdhdaPacket;
};

export default function UdhdaReturnPage() {
  const { toast } = useToast();
  const [udhdhaPackets, setUdhdhaPackets] = useLocalStorage<UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
  
  const [barcode, setBarcode] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    const existingPacket = udhdhaPackets.find(p => p.barcode === barcode);

    if (!existingPacket) {
      setLastScanResult({
        status: 'error',
        title: 'Packet Not Found',
        message: `Barcode "${barcode}" was not found in the Udhda assignment log.`,
      });
      setBarcode('');
      return;
    }

    if (existingPacket.isReturned) {
      setLastScanResult({
        status: 'warning',
        title: 'Already Returned',
        message: `This packet was already returned on ${format(new Date(existingPacket.returnTime!), 'PPp')}.`,
        packet: existingPacket,
      });
      setBarcode('');
      return;
    }

    // Process the return
    let returnedPacket: UdhdaPacket | undefined;
    const updatedPackets = udhdhaPackets.map(p => {
      if (p.id === existingPacket.id) {
        returnedPacket = { ...p, isReturned: true, returnTime: new Date().toISOString() };
        return returnedPacket;
      }
      return p;
    });

    setUdhdhaPackets(updatedPackets);

    toast({ title: 'Packet Returned', description: `Barcode ${barcode} marked as returned.` });
    setLastScanResult({
        status: 'success',
        title: 'Return Successful',
        message: `Packet ${barcode} has been successfully marked as returned.`,
        packet: returnedPacket,
    });
    setBarcode('');
  };

  const getAlertVariant = (status: ScanResult['status']) => {
    if (status === 'error') return 'destructive';
    if (status === 'warning') return 'default';
    return 'default'; // Success can use default style
  }
  
  const getAlertIcon = (status: ScanResult['status']) => {
    if (status === 'error') return <XCircle className="h-4 w-4" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <PageHeader title="Udhda Return" description="Scan a packet barcode to mark it as returned." />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Scan Packet Barcode</CardTitle>
          <CardDescription>Enter a barcode to process its return.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBarcodeScan} className="flex gap-2">
            <Input
              placeholder="Scan barcode..."
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
            />
            <Button type="submit" disabled={!barcode}>
              <Barcode className="mr-2 h-4 w-4" /> Return
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {lastScanResult && (
        <Alert variant={getAlertVariant(lastScanResult.status)} className="max-w-md mx-auto">
          {getAlertIcon(lastScanResult.status)}
          <AlertTitle>{lastScanResult.title}</AlertTitle>
          <AlertDescription>{lastScanResult.message}</AlertDescription>
           {lastScanResult.packet && (
            <div className="mt-4 text-sm space-y-1 text-foreground/80 border-t pt-2">
              <p><strong>Barcode:</strong> {lastScanResult.packet.barcode}</p>
              <p><strong>Operator:</strong> {lastScanResult.packet.operator}</p>
              <p><strong>Assigned:</strong> {format(new Date(lastScanResult.packet.assignmentTime), 'PPp')}</p>
              {lastScanResult.packet.isReturned && lastScanResult.packet.returnTime && (
                <p><strong>Returned:</strong> {format(new Date(lastScanResult.packet.returnTime), 'PPp')}</p>
              )}
            </div>
           )}
        </Alert>
      )}

    </div>
  );
}

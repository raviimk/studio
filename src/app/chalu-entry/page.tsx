
'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Maximize, Minimize, Save } from 'lucide-react';
import { useLayout } from '@/hooks/useLayout';

export default function ChaluEntryPage() {
  const { toast } = useToast();
  const { isFullscreen, setFullscreen } = useLayout();
  
  const [kapanNumber, setKapanNumber] = useState('');
  const [packetNumber, setPacketNumber] = useState('');
  const [originalPcs, setOriginalPcs] = useState('');
  const [adjustment, setAdjustment] = useState('');

  const originalCount = parseInt(originalPcs, 10) || 0;
  const adjustmentValue = parseInt(adjustment, 10) || 0;
  const currentCount = originalCount + adjustmentValue;

  const handleSave = () => {
    toast({ title: 'Saved (Simulation)', description: 'This is a UI demonstration. No data was saved.' });
  };
  
  useEffect(() => {
    // Exit fullscreen when the component unmounts
    return () => {
        if(isFullscreen) {
            setFullscreen(false);
        }
    }
  }, [isFullscreen, setFullscreen]);


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader title="Chalu / Running Packet Entry" description="Log progress on active lots." />
        <Button variant="ghost" size="icon" onClick={() => setFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize/> : <Maximize />}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Log Production Progress</CardTitle>
          <CardDescription>Select a lot and enter the number of packets completed or adjusted today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">Kapan Number</label>
              <Select value={kapanNumber} onValueChange={setKapanNumber}>
                <SelectTrigger><SelectValue placeholder="Select Kapan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kapan1">Kapan 1</SelectItem>
                  <SelectItem value="kapan2">Kapan 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-1">
              <label className="text-sm font-medium">Packet Number</label>
              <Input 
                value={packetNumber}
                onChange={(e) => setPacketNumber(e.target.value)}
                placeholder="Enter packet no."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Original PCS</label>
              <Input 
                type="number"
                value={originalPcs}
                onChange={(e) => setOriginalPcs(e.target.value)}
                placeholder="Enter original count"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Adjustment (+/-)</label>
              <Input 
                type="number" 
                value={adjustment} 
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="e.g., -1 or 5"
              />
            </div>
             <div>
              <label className="text-sm font-medium">Current PCS</label>
              <Input 
                value={currentCount} 
                readOnly 
                disabled 
                className="font-bold text-lg"
              />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4">
            <Save className="mr-2" /> Save Progress
          </Button>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Entry Log (Example)</CardTitle>
              <CardDescription>This is a placeholder to show how saved entries would look.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Kapan / Packet</TableHead>
                          <TableHead>Original</TableHead>
                          <TableHead>Adjustment</TableHead>
                          <TableHead>Current</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow>
                          <TableCell>
                            <div className="font-medium">Kapan 1 / P-101</div>
                          </TableCell>
                          <TableCell>10</TableCell>
                          <TableCell className="font-semibold text-destructive">-2</TableCell>
                          <TableCell className="font-bold">8</TableCell>
                      </TableRow>
                       <TableRow>
                          <TableCell>
                            <div className="font-medium">Kapan 2 / P-205</div>
                          </TableCell>
                          <TableCell>25</TableCell>
                          <TableCell className="font-semibold text-green-600">+5</TableCell>
                          <TableCell className="font-bold">30</TableCell>
                      </TableRow>
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}

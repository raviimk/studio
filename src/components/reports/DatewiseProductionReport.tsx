
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function DatewiseProductionReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-wise Report</CardTitle>
        <CardDescription>This report is under construction.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
        <Construction className="h-16 w-16 mb-4" />
        <p className="font-semibold">Coming Soon!</p>
        <p>Functionality for date-wise reporting and exports will be available here.</p>
      </CardContent>
    </Card>
  );
}

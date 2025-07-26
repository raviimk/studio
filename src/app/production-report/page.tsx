
'use client';

import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TodaysProductionReport from '@/components/reports/TodaysProductionReport';
import DatewiseProductionReport from '@/components/reports/DatewiseProductionReport';

export default function ProductionReportPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader
        title="Production Entries"
        description="A central dashboard to review department-level productivity."
      />
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="today">Today's Production</TabsTrigger>
          <TabsTrigger value="datewise">Date-wise Report</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-6">
          <TodaysProductionReport />
        </TabsContent>
        <TabsContent value="datewise" className="mt-6">
          <DatewiseProductionReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

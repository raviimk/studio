'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/PageHeader';
import SarinPerformance from '@/components/dashboard/SarinPerformance';
import LaserPerformance from '@/components/dashboard/LaserPerformance';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader
        title="Performance Dashboard"
        description="Analyze Sarin and Laser production performance."
      />
      <Tabs defaultValue="sarin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="sarin">Sarin Performance</TabsTrigger>
          <TabsTrigger value="laser">Laser Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="sarin">
          <SarinPerformance />
        </TabsContent>
        <TabsContent value="laser">
          <LaserPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
}

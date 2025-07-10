
'use client';

import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SarinReport from '@/components/reports/SarinReport';
import LaserReport from '@/components/reports/LaserReport';
import FourPTechingReport from '@/components/reports/FourPTechingReport';
import FourPWorkReport from '@/components/reports/FourPWorkReport';

export default function AnalysisReportPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader
        title="Production Analysis & Reports Center"
        description="A central dashboard to analyze all factory production data."
      />
      <Tabs defaultValue="sarin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="sarin">Sarin Report</TabsTrigger>
          <TabsTrigger value="laser">Laser Report</TabsTrigger>
          <TabsTrigger value="4p-teching">4P Teching Report</TabsTrigger>
          <TabsTrigger value="4p-work">4P Work Report</TabsTrigger>
        </TabsList>
        <TabsContent value="sarin" className="mt-6">
          <SarinReport />
        </TabsContent>
        <TabsContent value="laser" className="mt-6">
          <LaserReport />
        </TabsContent>
        <TabsContent value="4p-teching" className="mt-6">
          <FourPTechingReport />
        </TabsContent>
        <TabsContent value="4p-work" className="mt-6">
          <FourPWorkReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { generateOperationalInsights, OperationalInsightsOutput } from '@/ai/flows/operational-insights-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Terminal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { SARIN_PACKETS_KEY, LASER_LOTS_KEY, REASSIGN_LOGS_KEY, SARIN_OPERATORS_KEY, LASER_OPERATORS_KEY, SARIN_MAPPINGS_KEY, LASER_MAPPINGS_KEY } from '@/lib/constants';
import { LaserLot, LaserMapping, LaserOperator, ReassignLog, SarinMapping, SarinOperator, SarinPacket } from '@/lib/types';

export default function InsightsPage() {
  const [sarinPackets] = useSyncedStorage<SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots] = useSyncedStorage<LaserLot[]>(LASER_LOTS_KEY, []);
  const [reassignLogs] = useSyncedStorage<ReassignLog[]>(REASSIGN_LOGS_KEY, []);
  const [sarinOperators] = useSyncedStorage<SarinOperator[]>(SARIN_OPERATORS_KEY, []);
  const [laserOperators] = useSyncedStorage<LaserOperator[]>(LASER_OPERATORS_KEY, []);
  const [sarinMappings] = useSyncedStorage<SarinMapping[]>(SARIN_MAPPINGS_KEY, []);
  const [laserMappings] = useSyncedStorage<LaserMapping[]>(LASER_MAPPINGS_KEY, []);

  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<OperationalInsightsOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setInsights(null);
    try {
      const result = await generateOperationalInsights({
        sarinPackets: JSON.stringify(sarinPackets),
        laserLots: JSON.stringify(laserLots),
        reassignLogs: JSON.stringify(reassignLogs),
        sarinOperators: JSON.stringify(sarinOperators),
        laserOperators: JSON.stringify(laserOperators),
        sarinMappings: JSON.stringify(sarinMappings),
        laserMappings: JSON.stringify(laserMappings),
      });
      setInsights(result);
      toast({ title: 'Success', description: 'Insights generated successfully.' });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate insights. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = sarinPackets.length > 0 || laserLots.length > 0;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PageHeader
        title="Operational Insights Generator"
        description="Use AI to analyze your production data and get actionable suggestions."
      />
      <Card>
        <CardHeader>
          <CardTitle>Generate Insights</CardTitle>
          <CardDescription>
            Click the button below to process your locally stored production data.
            The AI will analyze patterns and suggest improvements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasData && (
              <Alert variant="destructive" className="mb-4">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>No Data Found</AlertTitle>
                  <AlertDescription>
                    The application has not detected any production data. Please add some Sarin or Laser entries to generate insights.
                  </AlertDescription>
              </Alert>
          )}
          <Button onClick={handleGenerate} disabled={isLoading || !hasData}>
            {isLoading ? 'Generating...' : 'Generate AI Insights'}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>

          <div className="mt-6">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            {insights && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI Generated Insights</AlertTitle>
                <AlertDescription>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                    {insights.insights}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

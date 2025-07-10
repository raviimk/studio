'use server';

/**
 * @fileOverview A flow that uses generative AI to analyze historical production data and suggest operational improvements.
 *
 * - generateOperationalInsights - A function that generates operational insights based on historical data.
 * - OperationalInsightsInput - The input type for the generateOperationalInsights function.
 * - OperationalInsightsOutput - The return type for the generateOperationalInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OperationalInsightsInputSchema = z.object({
  sarinPackets: z.string().describe('JSON string of sarinPackets from localStorage'),
  laserLots: z.string().describe('JSON string of laserLots from localStorage'),
  reassignLogs: z.string().describe('JSON string of reassignLogs from localStorage'),
  sarinOperators: z.string().describe('JSON string of sarinOperators from localStorage'),
  laserOperators: z.string().describe('JSON string of laserOperators from localStorage'),
  sarinMappings: z.string().describe('JSON string of sarinMappings from localStorage'),
  laserMappings: z.string().describe('JSON string of laserMappings from localStorage'),
});
export type OperationalInsightsInput = z.infer<typeof OperationalInsightsInputSchema>;

const OperationalInsightsOutputSchema = z.object({
  insights: z.string().describe('Data-driven insights and suggestions for operational improvements.'),
});
export type OperationalInsightsOutput = z.infer<typeof OperationalInsightsOutputSchema>;

export async function generateOperationalInsights(input: OperationalInsightsInput): Promise<OperationalInsightsOutput> {
  return operationalInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'operationalInsightsPrompt',
  input: {schema: OperationalInsightsInputSchema},
  output: {schema: OperationalInsightsOutputSchema},
  prompt: `You are an AI assistant that analyzes diamond production data and suggests operational improvements. Analyze the provided historical data from localStorage, including sarinPackets, laserLots, reassignLogs, operators, and mappings. Identify patterns in production metrics and provide data-driven insights. Return suggestions in a concise, actionable format.

Historical Data:
Sarin Packets: {{{sarinPackets}}}
Laser Lots: {{{laserLots}}}
Reassignment Logs: {{{reassignLogs}}}
Sarin Operators: {{{sarinOperators}}}
Laser Operators: {{{laserOperators}}}
Sarin Mappings: {{{sarinMappings}}}
Laser Mappings: {{{laserMappings}}}

Insights and Suggestions:
`,
});

const operationalInsightsFlow = ai.defineFlow(
  {
    name: 'operationalInsightsFlow',
    inputSchema: OperationalInsightsInputSchema,
    outputSchema: OperationalInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

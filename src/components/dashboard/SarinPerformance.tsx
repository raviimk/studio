
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SarinPacket, SarinOperator } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '../ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function SarinPerformance() {
  const [sarinPackets] = useLocalStorage<SarinPacket[]>('sarinPackets', []);
  const [sarinOperators] = useLocalStorage<SarinOperator[]>('sarinOperators', []);
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredPackets = useMemo(() => {
    return sarinPackets.filter(packet => {
      const packetDate = new Date(packet.date);
      const isOperatorMatch = selectedOperator === 'all' || packet.operator === selectedOperator;
      const isDateMatch = dateRange?.from && dateRange?.to
        ? packetDate >= dateRange.from && packetDate <= dateRange.to
        : true;
      return isOperatorMatch && isDateMatch;
    });
  }, [sarinPackets, selectedOperator, dateRange]);

  const performanceData = useMemo(() => {
    const dataByOperator: { [key: string]: { name: string, packets: number, jiram: number } } = {};

    filteredPackets.forEach(packet => {
      if (!dataByOperator[packet.operator]) {
        dataByOperator[packet.operator] = { name: packet.operator, packets: 0, jiram: 0 };
      }
      dataByOperator[packet.operator].packets += packet.packetCount;
      dataByOperator[packet.operator].jiram += packet.jiramCount || 0;
    });
    return Object.values(dataByOperator);
  }, [filteredPackets]);
  
  const totalPackets = filteredPackets.reduce((sum, p) => sum + p.packetCount, 0);
  const totalJiram = filteredPackets.reduce((sum, p) => sum + (p.jiramCount || 0), 0);
  const returnedLots = filteredPackets.filter(p => p.isReturned).length;

  const topPerformers = [...performanceData].sort((a, b) => b.packets - a.packets).slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
           <div className="flex-1">
             <label className="text-sm font-medium">Operator</label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Select Operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operators</SelectItem>
                {sarinOperators.map(op => (
                  <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Date Range</label>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Packets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalPackets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Jiram Packets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalJiram}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lots Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{returnedLots}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="font-headline text-lg font-semibold text-foreground/90 p-2">Packets by Operator</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                 <defs>
                    <linearGradient id="gradientRegular" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gradient-regular-from)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--gradient-regular-to)" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="gradientJiram" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gradient-jiram)" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="var(--gradient-jiram)" stopOpacity={0.5}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false}/>
                <Tooltip 
                    cursor={{fill: 'hsla(var(--card) / 0.5)'}}
                    contentStyle={{
                        background: 'hsla(var(--background) / 0.8)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid hsla(var(--border) / 0.5)',
                        borderRadius: 'var(--radius)'
                    }}
                />
                <Legend iconSize={10}/>
                <Bar dataKey="packets" stackId="a" fill="url(#gradientRegular)" name="Regular Packets" radius={[4, 4, 0, 0]} />
                <Bar dataKey="jiram" stackId="a" fill="url(#gradientJiram)" name="Jiram Packets" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top 5 Performers (by Packets)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={topPerformers} dataKey="packets" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {topPerformers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: 'hsla(var(--background) / 0.8)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid hsla(var(--border) / 0.5)',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


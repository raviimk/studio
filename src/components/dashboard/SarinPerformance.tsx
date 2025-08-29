
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { SarinPacket, SarinOperator } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithPresets } from '../ui/date-picker-presets';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function SarinPerformance() {
  const [sarinPackets] = useSyncedStorage<SarinPacket[]>('sarinPackets', []);
  const [sarinOperators] = useSyncedStorage<SarinOperator[]>('sarinOperators', []);
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const filteredPackets = useMemo(() => {
    if (!sarinPackets) return [];
    return sarinPackets.filter(packet => {
      const packetDate = new Date(packet.date);
      const isOperatorMatch = selectedOperator === 'all' || packet.operator === selectedOperator;
       const isDateMatch = dateRange?.from
        ? packetDate >= startOfDay(dateRange.from) && packetDate <= endOfDay(dateRange.to || dateRange.from)
        : true;
      return isOperatorMatch && isDateMatch;
    });
  }, [sarinPackets, selectedOperator, dateRange]);

  const performanceData = useMemo(() => {
    const dataByOperator: { [key: string]: { name: string, packets: number, jiram: number } } = {};
    if (!filteredPackets) return [];
    filteredPackets.forEach(packet => {
      if (!dataByOperator[packet.operator]) {
        dataByOperator[packet.operator] = { name: packet.operator, packets: 0, jiram: 0 };
      }
      dataByOperator[packet.operator].packets += packet.packetCount || 0;
      dataByOperator[packet.operator].jiram += packet.jiramCount || 0;
    });
    return Object.values(dataByOperator);
  }, [filteredPackets]);

  const jiramByKapanData = useMemo(() => {
    const dataByKapan: { [key: string]: { kapanNumber: string; jiramCount: number } } = {};
    if (!filteredPackets) return [];

    filteredPackets.forEach(packet => {
      if (packet.jiramCount && packet.jiramCount > 0) {
        if (!dataByKapan[packet.kapanNumber]) {
          dataByKapan[packet.kapanNumber] = { kapanNumber: packet.kapanNumber, jiramCount: 0 };
        }
        dataByKapan[packet.kapanNumber].jiramCount += packet.jiramCount;
      }
    });

    return Object.values(dataByKapan)
      .sort((a, b) => b.jiramCount - a.jiramCount)
      .slice(0, 10); // Get top 10
  }, [filteredPackets]);
  
  const totalMainPackets = filteredPackets.reduce((sum, p) => sum + (p.mainPacketNumber || 0), 0);
  const totalPackets = filteredPackets.reduce((sum, p) => sum + (p.packetCount || 0), 0);
  const totalJiram = filteredPackets.reduce((sum, p) => sum + (p.jiramCount || 0), 0);
  const returnedLots = filteredPackets.filter(p => p.isReturned).length;

  const topPerformers = [...performanceData].sort((a, b) => b.packets - a.packets).slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
           <div className="flex-1">
             <label className="text-sm font-medium">Operator</label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Select Operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operators</SelectItem>
                {(sarinOperators || []).map(op => (
                  <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Date Range</label>
            <DatePickerWithPresets date={dateRange} setDate={setDateRange} />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Main Packets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalMainPackets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Sub Packets</CardTitle>
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

      <div className="grid gap-4 lg:grid-cols-2">
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
                    <defs>
                        <radialGradient id="color1">
                            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                            <stop offset="75%" stopColor="hsl(var(--chart-1))" stopOpacity={1} />
                        </radialGradient>
                         <radialGradient id="color2">
                            <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                            <stop offset="75%" stopColor="hsl(var(--chart-2))" stopOpacity={1} />
                        </radialGradient>
                         <radialGradient id="color3">
                            <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.4} />
                            <stop offset="75%" stopColor="hsl(var(--chart-3))" stopOpacity={1} />
                        </radialGradient>
                         <radialGradient id="color4">
                            <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.4} />
                            <stop offset="75%" stopColor="hsl(var(--chart-4))" stopOpacity={1} />
                        </radialGradient>
                         <radialGradient id="color5">
                            <stop offset="0%" stopColor="hsl(var(--chart-5))" stopOpacity={0.4} />
                            <stop offset="75%" stopColor="hsl(var(--chart-5))" stopOpacity={1} />
                        </radialGradient>
                    </defs>
                    <Pie data={topPerformers} dataKey="packets" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {topPerformers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#color${index + 1})`} />
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

       <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Kapans by Jiram Count</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jiramByKapanData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="kapanNumber" type="category" width={60} />
                <Tooltip 
                   cursor={{fill: 'hsla(var(--card) / 0.5)'}}
                   contentStyle={{
                       background: 'hsla(var(--background) / 0.8)',
                       backdropFilter: 'blur(4px)',
                       border: '1px solid hsla(var(--border) / 0.5)',
                       borderRadius: 'var(--radius)'
                   }}
                />
                <Legend />
                <Bar dataKey="jiramCount" name="Jiram Count" fill="hsl(var(--chart-2))" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

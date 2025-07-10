'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SarinPacket, SarinOperator } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '../ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

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
        <Card>
          <CardHeader>
            <CardTitle>Packets by Operator</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="packets" stackId="a" fill="hsl(var(--primary))" name="Regular Packets" />
                <Bar dataKey="jiram" stackId="a" fill="hsl(var(--accent))" name="Jiram Packets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
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
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

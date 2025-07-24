
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LaserLot, LaserOperator } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '../ui/button';
import { DatePickerWithRange } from '../ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function LaserPerformance() {
  const [laserLots] = useLocalStorage<LaserLot[]>('laserLots', []);
  const [laserOperators] = useLocalStorage<LaserOperator[]>('laserOperators', []);
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredLots = useMemo(() => {
    return laserLots.filter(lot => {
      const lotDate = new Date(lot.entryDate);
      const isOperatorMatch = selectedOperator === 'all' || lot.returnedBy === selectedOperator;
      const isDateMatch = dateRange?.from && dateRange?.to
        ? lotDate >= dateRange.from && lotDate <= dateRange.to
        : true;
      return isOperatorMatch && isDateMatch;
    });
  }, [laserLots, selectedOperator, dateRange]);

  const performanceData = useMemo(() => {
    const dataByOperator: { [key: string]: { name: string, lots: number, packets: number } } = {};

    filteredLots.forEach(lot => {
      const operator = lot.returnedBy || 'Unassigned';
      if (!dataByOperator[operator]) {
        dataByOperator[operator] = { name: operator, lots: 0, packets: 0 };
      }
      dataByOperator[operator].lots += 1;
      dataByOperator[operator].packets += lot.packetCount;
    });
    return Object.values(dataByOperator);
  }, [filteredLots]);
  
  const totalLots = filteredLots.length;
  const totalPackets = filteredLots.reduce((sum, lot) => sum + lot.packetCount, 0);
  const returnedLots = filteredLots.filter(lot => lot.isReturned).length;

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
                {laserOperators.map(op => (
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
            <CardTitle>Total Lots Made</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalLots}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Packets Handled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalPackets}</p>
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
                <Bar dataKey="packets" fill="hsl(var(--primary))" name="Packets Handled" />
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

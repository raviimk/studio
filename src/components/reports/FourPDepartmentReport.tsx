
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_DEPARTMENT_SETTINGS_KEY } from '@/lib/constants';
import { FourPLot, FourPDepartmentSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithPresets } from '@/components/ui/date-picker-presets';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type KapanSummary = {
    kapanNumber: string;
    departments: Record<string, number>;
    totalPcs: number;
}

export default function FourPDepartmentReport() {
  const [fourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [deptSettings] = useLocalStorage<FourPDepartmentSettings>(FOURP_DEPARTMENT_SETTINGS_KEY, { caratThreshold: 0.009, aboveThresholdDeptName: 'Big Dept', belowThresholdDeptName: 'Small Dept' });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return fourPTechingLots.filter(lot => {
      if (!lot.department) return false;

      const lotDate = new Date(lot.entryDate);
      const isDateMatch = dateRange?.from && dateRange?.to
        ? lotDate >= startOfDay(dateRange.from) && lotDate <= endOfDay(dateRange.to)
        : true;
      
      const searchLower = searchTerm.toLowerCase();
      const isSearchMatch = !searchTerm ||
        lot.kapan.toLowerCase().includes(searchLower);
        
      return isDateMatch && isSearchMatch;
    });
  }, [fourPTechingLots, dateRange, searchTerm]);

  const kapanSummary = useMemo((): KapanSummary[] => {
    const summary: Record<string, KapanSummary> = {};

    filteredData.forEach(lot => {
        if (!lot.department) return;
        
        if (!summary[lot.kapan]) {
            summary[lot.kapan] = {
                kapanNumber: lot.kapan,
                departments: {},
                totalPcs: 0
            };
        }
        
        const kapan = summary[lot.kapan];
        const pcs = lot.pcs || 0;
        kapan.departments[lot.department] = (kapan.departments[lot.department] || 0) + pcs;
        kapan.totalPcs += pcs;
    });

    return Object.values(summary).sort((a,b) => parseInt(a.kapanNumber) - parseInt(b.kapanNumber));
  }, [filteredData]);
  
  const departmentNames = useMemo(() => {
    return [deptSettings.belowThresholdDeptName, deptSettings.aboveThresholdDeptName];
  },[deptSettings]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>4P Department Production Report</CardTitle>
          <CardDescription>Kapan-wise summary of pieces (Total PCS) assigned to different departments based on carat weight.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
             <div>
              <label className="text-sm font-medium">Search by Kapan</label>
              <Input
                placeholder="Search Kapan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithPresets date={dateRange} setDate={setDateRange} />
            </div>
          </div>
          <Button onClick={handlePrint} className="mt-4">Print Report</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Kapan Summary (by Total PCS)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kapan</TableHead>
                  {departmentNames.map(name => <TableHead key={name}>{name}</TableHead>)}
                  <TableHead>Total PCS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kapanSummary.map(summary => (
                  <TableRow key={summary.kapanNumber}>
                    <TableCell className="font-bold">{summary.kapanNumber}</TableCell>
                    {departmentNames.map(name => <TableCell key={name}>{summary.departments[name] || 0}</TableCell>)}
                    <TableCell className="font-semibold">{summary.totalPcs}</TableCell>
                  </TableRow>
                ))}
                {kapanSummary.length === 0 && <TableRow><TableCell colSpan={departmentNames.length + 2} className="text-center text-muted-foreground">No data matches your filters.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

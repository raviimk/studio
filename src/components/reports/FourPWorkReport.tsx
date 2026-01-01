
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FOURP_TECHING_LOTS_KEY, FOURP_OPERATORS_KEY, FOURP_DEPARTMENT_SETTINGS_KEY } from '@/lib/constants';
import { FourPLot, FourPOperator, FourPDepartmentSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Input } from '../ui/input';

export default function FourPWorkReport() {
  const [fourPTechingLots] = useLocalStorage<FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
  const [fourPOperators] = useLocalStorage<FourPOperator[]>(FOURP_OPERATORS_KEY, []);
  const [deptSettings] = useLocalStorage<FourPDepartmentSettings>(FOURP_DEPARTMENT_SETTINGS_KEY, { caratThreshold: 0.009, aboveThresholdDeptName: 'Big Dept', belowThresholdDeptName: 'Small Dept' });

  const [selectedOperator, setSelectedOperator] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return (fourPTechingLots || []).filter(lot => {
      if (!lot.isReturnedToFourP || !lot.returnDate) return false;
      const lotDate = new Date(lot.returnDate);
      
      const operatorMatch = selectedOperator === 'all' || 
        (lot.fourPData ? lot.fourPData.some(d => d.operator === selectedOperator) : lot.fourPOperator === selectedOperator);

      const isDateMatch = dateRange?.from
        ? lotDate >= startOfDay(dateRange.from) && lotDate <= endOfDay(dateRange.to || dateRange.from)
        : true;
      
      const searchLower = searchTerm.toLowerCase();
      const isSearchMatch = !searchTerm ||
        lot.lot.toLowerCase().includes(searchLower) ||
        lot.kapan.toLowerCase().includes(searchLower);

      return operatorMatch && isDateMatch && isSearchMatch;
    }).sort((a, b) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime());
  }, [fourPTechingLots, selectedOperator, dateRange, searchTerm]);

  const summaryByDepartment = useMemo(() => {
    const deptSummary: Record<string, { totalPcs: number, totalAmount: number, lotCount: number }> = {};
    const departmentNames = [deptSettings.aboveThresholdDeptName, deptSettings.belowThresholdDeptName];
    departmentNames.forEach(name => {
      deptSummary[name] = { totalPcs: 0, totalAmount: 0, lotCount: 0 };
    });

    filteredData.forEach(lot => {
      const dept = lot.department || 'Unknown';
      if (!deptSummary[dept]) {
        deptSummary[dept] = { totalPcs: 0, totalAmount: 0, lotCount: 0 };
      }
      deptSummary[dept].totalPcs += lot.finalPcs || 0;
      deptSummary[dept].totalAmount += lot.fourPAmount || 0;
      deptSummary[dept].lotCount += 1;
    });

    return deptSummary;
  }, [filteredData, deptSettings]);

  const grandTotal = useMemo(() => {
    return Object.values(summaryByDepartment).reduce((acc, summary) => {
        acc.totalPcs += summary.totalPcs;
        acc.totalAmount += summary.totalAmount;
        return acc;
    }, { totalPcs: 0, totalAmount: 0 });
  }, [summaryByDepartment]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>4P Work Report</CardTitle>
          <CardDescription>Analyze all completed 4P work entries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">4P Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger><SelectValue placeholder="Select Operator" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {(fourPOperators || []).map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
           <div className="pt-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by Lot or Kapan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          <Button onClick={handlePrint} className="mt-4">Print Report</Button>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
         <Card className="md:col-span-1 bg-primary text-primary-foreground">
            <CardHeader>
                <CardTitle>Grand Total</CardTitle>
                <CardDescription className="text-primary-foreground/80">Combined summary of all departments.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-primary-foreground/80">Total Final PCS</p>
                    <p className="text-3xl font-bold">{grandTotal.totalPcs.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-sm text-primary-foreground/80">Total Amount (₹)</p>
                    <p className="text-3xl font-bold">₹{grandTotal.totalAmount.toFixed(2)}</p>
                </div>
            </CardContent>
        </Card>
        {Object.entries(summaryByDepartment).map(([deptName, summary]) => (
            <Card key={deptName} className="md:col-span-1">
              <CardHeader>
                <CardTitle>{deptName}</CardTitle>
                <CardDescription>Summary for this department</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                      <p className="text-sm text-muted-foreground">Total Final PCS</p>
                      <p className="text-2xl font-bold">{summary.totalPcs.toLocaleString()}</p>
                  </div>
                  <div>
                      <p className="text-sm text-muted-foreground">Total Amount (₹)</p>
                      <p className="text-2xl font-bold">₹{summary.totalAmount.toFixed(2)}</p>
                  </div>
              </CardContent>
            </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Report Data</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Kapan</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>4P Operator(s)</TableHead>
                  <TableHead>Final PCS</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.returnDate ? format(new Date(lot.returnDate), 'PP') : 'N/A'}</TableCell>
                    <TableCell>{lot.kapan}</TableCell>
                    <TableCell>{lot.lot}</TableCell>
                    <TableCell><Badge>{lot.department}</Badge></TableCell>
                    <TableCell>
                      {lot.fourPData && lot.fourPData.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {lot.fourPData.map(d => (
                            <Badge key={d.operator} variant="secondary">{d.operator} ({d.pcs} pcs)</Badge>
                          ))}
                        </div>
                      ) : <Badge>{lot.fourPOperator}</Badge>}
                    </TableCell>
                    <TableCell className="font-bold">{lot.finalPcs}</TableCell>
                    <TableCell>₹{(lot.fourPAmount ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No data matches your filters.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

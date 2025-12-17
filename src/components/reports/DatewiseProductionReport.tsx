
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  SARIN_PACKETS_KEY,
  LASER_LOTS_KEY,
  FOURP_TECHING_LOTS_KEY,
} from '@/lib/constants';
import * as T from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePickerWithPresets } from '@/components/ui/date-picker-presets';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, parseISO, format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { Diamond, Gem, Puzzle, Sparkles } from 'lucide-react';


type DepartmentData = {
    [operator: string]: {
        sarinReturned?: number;
        sarinChalu?: number;
        laserPcs?: number;
        fourPPcs?: number;
        fourPTechingPcs?: number;
    }
}

const DepartmentCard = ({ title, total, borderColor, children, icon: Icon }: { title: string, total: number | string, borderColor: string, children: React.ReactNode, icon: React.ElementType }) => (
    <Card className={cn("overflow-hidden border-t-4", borderColor)}>
        <CardHeader className="flex flex-row items-start justify-between pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
                 <Icon className={cn("h-5 w-5", borderColor.replace('border-','text-'))} />
                 {title}
            </CardTitle>
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Today's Production</p>
                <p className="text-2xl font-bold">{total}</p>
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);


export default function DatewiseProductionReport() {
  const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);
  const [laserLots] = useLocalStorage<T.LaserLot[]>(LASER_LOTS_KEY, []);
  const [fourPTechingLots] = useLocalStorage<T.FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const departmentData = useMemo(() => {
    if (!dateRange?.from) return {};
    
    const data: DepartmentData = {};
    const dateFilter = { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from) };

    const ensureOperator = (operator: string) => {
        if (!data[operator]) {
            data[operator] = {};
        }
    }

    // Sarin
    sarinPackets.forEach(p => {
        if (p.isReturned && p.returnDate && p.returnedBy && isWithinInterval(parseISO(p.returnDate), dateFilter)) {
            ensureOperator(p.returnedBy);
            data[p.returnedBy].sarinReturned = (data[p.returnedBy].sarinReturned || 0) + p.packetCount;
        }
        if (!p.isReturned && isWithinInterval(parseISO(p.date), dateFilter)) {
            ensureOperator(p.operator);
            data[p.operator].sarinChalu = (data[p.operator].sarinChalu || 0) + p.packetCount;
        }
    });

    // Laser
    laserLots.forEach(l => {
        if (l.isReturned && l.returnDate && l.returnedBy && isWithinInterval(parseISO(l.returnDate), dateFilter)) {
            ensureOperator(l.returnedBy);
            const pcs = l.subPacketCount ?? l.packetCount;
            data[l.returnedBy].laserPcs = (data[l.returnedBy].laserPcs || 0) + pcs;
        }
    });

    // 4P & 4P Teching
    fourPTechingLots.forEach(l => {
        if (isWithinInterval(parseISO(l.entryDate), dateFilter)) {
            ensureOperator(l.techingOperator);
            data[l.techingOperator].fourPTechingPcs = (data[l.techingOperator].fourPTechingPcs || 0) + (l.finalPcs || 0);
        }
        if (l.isReturnedToFourP && l.returnDate && isWithinInterval(parseISO(l.returnDate), dateFilter)) {
            if (l.fourPData) {
                l.fourPData.forEach(d => {
                    ensureOperator(d.operator);
                    data[d.operator].fourPPcs = (data[d.operator].fourPPcs || 0) + d.pcs;
                });
            } else if (l.fourPOperator) {
                ensureOperator(l.fourPOperator);
                data[l.fourPOperator].fourPPcs = (data[l.fourPOperator].fourPPcs || 0) + (l.finalPcs || 0);
            }
        }
    });

    return data;

  }, [sarinPackets, laserLots, fourPTechingLots, dateRange]);


  const sarinData = useMemo(() => Object.entries(departmentData)
        .filter(([,depts]) => depts.sarinReturned || depts.sarinChalu)
        .map(([op, depts]) => ({ operator: op, returned: depts.sarinReturned || 0, chalu: depts.sarinChalu || 0, total: (depts.sarinReturned || 0) + (depts.sarinChalu || 0) }))
        .sort((a,b) => b.total - a.total), [departmentData]);

  const laserData = useMemo(() => Object.entries(departmentData)
        .filter(([,depts]) => depts.laserPcs)
        .map(([op, depts]) => ({ operator: op, pcs: depts.laserPcs || 0 }))
        .sort((a,b) => b.pcs - a.pcs), [departmentData]);

  const fourPData = useMemo(() => Object.entries(departmentData)
        .filter(([,depts]) => depts.fourPPcs)
        .map(([op, depts]) => ({ operator: op, pcs: depts.fourPPcs || 0 }))
        .sort((a,b) => b.pcs - a.pcs), [departmentData]);
  
  const fourPTechingData = useMemo(() => Object.entries(departmentData)
        .filter(([,depts]) => depts.fourPTechingPcs)
        .map(([op, depts]) => ({ operator: op, pcs: depts.fourPTechingPcs || 0 }))
        .sort((a,b) => b.pcs - a.pcs), [departmentData]);

  const totals = useMemo(() => {
    return Object.values(departmentData).reduce((acc, operatorDepts) => {
        acc.sarin += (operatorDepts.sarinReturned || 0) + (operatorDepts.sarinChalu || 0);
        acc.laser += operatorDepts.laserPcs || 0;
        acc.fourP += operatorDepts.fourPPcs || 0;
        acc.fourPTeching += operatorDepts.fourPTechingPcs || 0;
        return acc;
    }, { sarin: 0, laser: 0, fourP: 0, fourPTeching: 0 });
  }, [departmentData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Date-wise All Departments Report</CardTitle>
        <CardDescription>View production for all operators across Sarin, Laser, and 4P within a selected date range.</CardDescription>
        <div className="pt-4">
             <label className="text-sm font-medium">Date Range</label>
             <DatePickerWithPresets date={dateRange} setDate={setDateRange} />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
            <DepartmentCard title="Sarin Department" total={totals.sarin} borderColor="border-orange-400" icon={Diamond}>
                <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Returned</TableHead><TableHead>Chalu</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {sarinData.map(d => (
                            <TableRow key={d.operator}>
                                <TableCell>{d.operator}</TableCell>
                                <TableCell>{d.returned || '-'}</TableCell>
                                <TableCell>{d.chalu || '-'}</TableCell>
                                <TableCell className="text-right font-bold text-orange-600">{d.total}</TableCell>
                            </TableRow>
                        ))}
                        {sarinData.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No Sarin data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
             <DepartmentCard title="Laser Department" total={totals.laser} borderColor="border-red-400" icon={Gem}>
                <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {laserData.map(d => (
                            <TableRow key={d.operator}><TableCell>{d.operator}</TableCell><TableCell className="text-right font-bold text-red-600">{d.pcs}</TableCell></TableRow>
                        ))}
                        {laserData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No Laser data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
             <DepartmentCard title="4P Department" total={totals.fourP} borderColor="border-green-400" icon={Puzzle}>
                 <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fourPData.map(d => (
                            <TableRow key={d.operator}><TableCell>{d.operator}</TableCell><TableCell className="text-right font-bold text-green-600">{d.pcs}</TableCell></TableRow>
                        ))}
                        {fourPData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No 4P data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
            <DepartmentCard title="4P Teching" total={totals.fourPTeching} borderColor="border-blue-400" icon={Sparkles}>
                 <Table>
                    <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead className="text-right">Total PCS</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {fourPTechingData.map(d => (
                            <TableRow key={d.operator}><TableCell>{d.operator}</TableCell><TableCell className="text-right font-bold text-blue-600">{d.pcs}</TableCell></TableRow>
                        ))}
                        {fourPTechingData.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No 4P Teching data for this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </DepartmentCard>
      </CardContent>
    </Card>
  );
}


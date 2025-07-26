
'use client';

import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isToday, format, parseISO } from 'date-fns';
import {
    SARIN_PACKETS_KEY,
    LASER_LOTS_KEY,
    UHDHA_PACKETS_KEY,
    FOURP_TECHING_LOTS_KEY,
    SARIN_OPERATORS_KEY,
    LASER_OPERATORS_KEY,
    FOURP_OPERATORS_KEY,
    FOURP_TECHING_OPERATORS_KEY
} from '@/lib/constants';
import * as T from '@/lib/types';

type Operator = { id: string; name: string };

const DEPARTMENTS = [
    { id: 'sarin', name: 'Sarin' },
    { id: 'laser', name: 'Laser' },
    { id: 'udhdha', name: 'Udhda' },
    { id: '4p_teching', name: '4P Teching' },
    { id: '4p_work', name: '4P Work' },
] as const;

type DepartmentId = typeof DEPARTMENTS[number]['id'];

interface ProductionData {
    id: string;
    department: string;
    operator: string;
    timestamp: string;
    details: Record<string, any>;
    // weight is in carats
    weight?: number; 
}


export default function TodaysProductionReport() {
    const [sarinPackets] = useLocalStorage<T.SarinPacket[]>(SARIN_PACKETS_KEY, []);
    const [laserLots] = useLocalStorage<T.LaserLot[]>(LASER_LOTS_KEY, []);
    const [udhdhaPackets] = useLocalStorage<T.UdhdaPacket[]>(UHDHA_PACKETS_KEY, []);
    const [fourPTechingLots] = useLocalStorage<T.FourPLot[]>(FOURP_TECHING_LOTS_KEY, []);
    
    const [sarinOperators] = useLocalStorage<T.SarinOperator[]>(SARIN_OPERATORS_KEY, []);
    const [laserOperators] = useLocalStorage<T.LaserOperator[]>(LASER_OPERATORS_KEY, []);
    const [fourPTechingOperators] = useLocalStorage<T.FourPTechingOperator[]>(FOURP_TECHING_OPERATORS_KEY, []);
    const [fourPOperators] = useLocalStorage<T.FourPOperator[]>(FOURP_OPERATORS_KEY, []);

    const [selectedDept, setSelectedDept] = useState<DepartmentId | ''>('');
    const [selectedOperator, setSelectedOperator] = useState('');

    const operatorsForDept = useMemo((): Operator[] => {
        switch (selectedDept) {
            case 'sarin': return sarinOperators;
            case 'laser': return laserOperators;
            case 'udhdha':
                // Udhda can have both sarin and laser operators
                const udhdaOps = new Map<string, Operator>();
                [...sarinOperators, ...laserOperators].forEach(op => udhdaOps.set(op.name, op));
                return Array.from(udhdaOps.values());
            case '4p_teching': return fourPTechingOperators;
            case '4p_work': return fourPOperators;
            default: return [];
        }
    }, [selectedDept, sarinOperators, laserOperators, fourPTechingOperators, fourPOperators]);

    const todaysData = useMemo((): ProductionData[] => {
        if (!selectedDept || !selectedOperator) return [];

        let data: ProductionData[] = [];
        
        switch (selectedDept) {
            case 'sarin':
                data = sarinPackets
                    .filter(p => p.operator === selectedOperator && isToday(parseISO(p.date)))
                    .map(p => ({
                        id: p.id,
                        department: 'Sarin',
                        operator: p.operator,
                        timestamp: p.date,
                        details: { Kapan: p.kapanNumber, Lot: p.lotNumber, Pcs: p.packetCount, Jiram: p.jiramCount || 0 },
                    }));
                break;
            case 'laser':
                 data = laserLots
                    .filter(l => l.returnedBy === selectedOperator && l.returnDate && isToday(parseISO(l.returnDate)))
                    .map(l => ({
                        id: l.id,
                        department: 'Laser',
                        operator: l.returnedBy!,
                        timestamp: l.returnDate!,
                        details: { Kapan: l.kapanNumber, Lot: l.lotNumber, Pcs: l.packetCount, Tension: l.tensionType },
                    }));
                break;
            case 'udhdha':
                data = udhdhaPackets
                    .filter(p => p.operator === selectedOperator && p.returnTime && isToday(parseISO(p.returnTime)))
                    .map(p => ({
                        id: p.id,
                        department: 'Udhda',
                        operator: p.operator,
                        timestamp: p.returnTime!,
                        details: { Barcode: p.barcode, Type: p.type },
                    }));
                break;
            case '4p_teching':
                data = fourPTechingLots
                    .filter(l => l.techingOperator === selectedOperator && isToday(parseISO(l.entryDate)))
                    .map(l => ({
                        id: l.id,
                        department: '4P Teching',
                        operator: l.techingOperator,
                        timestamp: l.entryDate,
                        details: { Kapan: l.kapan, Lot: l.lot, 'Final Pcs': l.finalPcs, Amount: `₹${l.techingAmount.toFixed(2)}` },
                        weight: l.carat,
                    }));
                break;
            case '4p_work':
                data = fourPTechingLots
                    .filter(l => l.fourPOperator === selectedOperator && l.returnDate && isToday(parseISO(l.returnDate)))
                    .map(l => ({
                        id: l.id,
                        department: '4P Work',
                        operator: l.fourPOperator!,
                        timestamp: l.returnDate!,
                        details: { Kapan: l.kapan, Lot: l.lot, 'Final Pcs': l.finalPcs, Amount: `₹${(l.fourPAmount || 0).toFixed(2)}` },
                        weight: l.carat,
                    }));
                break;
        }
        return data.sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());

    }, [selectedDept, selectedOperator, sarinPackets, laserLots, udhdhaPackets, fourPTechingLots]);

    const summary = useMemo(() => {
        if (todaysData.length === 0) return null;

        const timestamps = todaysData.map(d => parseISO(d.timestamp));
        const firstActivity = timestamps[timestamps.length - 1];
        const lastActivity = timestamps[0];

        const totalWeight = todaysData.reduce((sum, item) => sum + (item.weight || 0), 0);

        return {
            packetsCompleted: todaysData.length,
            totalWeightCarats: totalWeight,
            totalWeightCents: totalWeight * 100,
            firstActivity: format(firstActivity, 'p'),
            lastActivity: format(lastActivity, 'p'),
        };
    }, [todaysData]);

    const tableHeaders = useMemo(() => {
        if(todaysData.length === 0) return [];
        return ['Time', ...Object.keys(todaysData[0].details)];
    }, [todaysData]);

    const handleDeptChange = (deptId: string) => {
        setSelectedDept(deptId as DepartmentId);
        setSelectedOperator('');
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Select a department and operator to see their production for today.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium">Department</label>
                        <Select value={selectedDept} onValueChange={handleDeptChange}>
                            <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                            <SelectContent>
                                {DEPARTMENTS.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium">Operator</label>
                        <Select value={selectedOperator} onValueChange={setSelectedOperator} disabled={!selectedDept}>
                            <SelectTrigger><SelectValue placeholder="Select Operator" /></SelectTrigger>
                            <SelectContent>
                                {operatorsForDept.map(op => <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedOperator && summary && (
                 <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Operator</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{selectedOperator}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Packets/Lots</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{summary.packetsCompleted}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Total Cts/Cents</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{summary.totalWeightCarats.toFixed(3)} / {summary.totalWeightCents.toFixed(3)}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">First Activity</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{summary.firstActivity}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-sm font-medium">Last Activity</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{summary.lastActivity}</p></CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Detailed Log</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {tableHeaders.map(h => <TableHead key={h}>{h}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {todaysData.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{format(parseISO(item.timestamp), 'p')}</TableCell>
                                                {Object.values(item.details).map((val, i) => <TableCell key={i}>{val}</TableCell>)}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            )}
             {selectedOperator && !summary && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No production data found for {selectedOperator} today.</p>
                </div>
            )}
        </div>
    );
}

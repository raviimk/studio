

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Maximize, Minimize, Save, PlusCircle, Edit, Trash2, FileText, Settings, X, RefreshCw, Upload, Search, Undo2, CheckCircle2, Check, Circle, History, Rows, MinusCircle, ArrowDownWideNarrow, Clock, Computer } from 'lucide-react';
import { useLayout } from '@/hooks/useLayout';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, deleteDoc, orderBy, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STATION_NAME_KEY } from '@/lib/constants';
import type { ChaluEntry } from '@/lib/types';


type Kapan = {
    id: string;
    kapanNumber: string;
};

type ScanEntry = {
    id: string;
    barcode: string;
    kapanNumber: string;
    packetNumber: string;
    suffix: string;
    scanTime: {
        seconds: number;
        nanoseconds: number;
    }
}

type CombinedScanEntry = ScanEntry & { type: 'jiram' | 'minus' };


export default function ChaluEntryPage() {
  const { toast } = useToast();
  const { isFullscreen, setFullscreen } = useLayout();
  const router = useRouter();

  const firestore = useFirestore();
  const importFileRef = useRef<HTMLInputElement>(null);
  const returnScanInputRef = useRef<HTMLInputElement>(null);
  
  const chaluEntriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'chaluEntries'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const kapansQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'kapans'));
  }, [firestore]);
  
  const jiramEntriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jiramEntries'), orderBy('scanTime', 'desc'));
  }, [firestore]);
  
  const minusScanEntriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'minusScanEntries'), orderBy('scanTime', 'desc'));
  }, [firestore]);


  const { data: chaluEntries, loading: loadingEntries, refetch: refetchChaluEntries } = useCollection<ChaluEntry>(chaluEntriesQuery);
  const { data: kapans, loading: loadingKapans } = useCollection<Kapan>(kapansQuery);
  const { data: jiramEntries, loading: loadingJiramEntries, refetch: refetchJiramEntries } = useCollection<ScanEntry>(jiramEntriesQuery);
  const { data: minusScanEntries, loading: loadingMinusScans, refetch: refetchMinusScans } = useCollection<ScanEntry>(minusScanEntriesQuery);
  
  const [kapanNumber, setKapanNumber] = useState('');
  const [packetNumber, setPacketNumber] = useState('');
  const [vajan, setVajan] = useState('');
  const [originalPcs, setOriginalPcs] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [suffix, setSuffix] = useState('');
  const [currentPcs, setCurrentPcs] = useState('');
  const [kapanFilter, setKapanFilter] = useState('');
  const [isReportOpen, setReportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'history'>('live');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [liveSearchTerm, setLiveSearchTerm] = useState('');
  
  const [pendingJiramId, setPendingJiramId] = useState<string | null>(null);
  const [pendingMinusScanId, setPendingMinusScanId] = useState<string | null>(null);

  const [stationName] = useLocalStorage<string>(STATION_NAME_KEY, '');

  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  
  const [lastClickedJiramId, setLastClickedJiramId] = useState<string | null>(null);

  // New state for combined scan list
  const [scanSearchTerm, setScanSearchTerm] = useState('');
  const [scanFilter, setScanFilter] = useState<'all' | 'jiram' | 'minus'>('all');
  const [scanSort, setScanSort] = useState<'numeric' | 'recent'>('numeric');


  // State for return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [entryToReturn, setEntryToReturn] = useState<ChaluEntry | null>(null);
  const [returnScanInput, setReturnScanInput] = useState('');
  const [scannedReturnPackets, setScannedReturnPackets] = useState<Set<string>>(new Set());
  
  // State for multi-select
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const [liveSelectionMode, setLiveSelectionMode] = useState(false);
  const [scanSelectionMode, setScanSelectionMode] = useState(false);

  // Use refs to store the latest state for the cleanup function
  const stateRef = useRef({
      kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment,
      editingId, editFormData, firestore, toast, pendingJiramId, pendingMinusScanId, stationName
  });

  useEffect(() => {
      stateRef.current = {
          kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment,
          editingId, editFormData, firestore, toast, pendingJiramId, pendingMinusScanId, stationName
      };
  }, [kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment, editingId, editFormData, firestore, toast, pendingJiramId, pendingMinusScanId, stationName]);

  const originalCount = parseInt(originalPcs, 10) || 0;
  const adjustmentValue = parseInt(adjustment, 10) || 0;
  
  useEffect(() => {
    const calculatedCurrent = originalCount + adjustmentValue;
    setCurrentPcs(String(calculatedCurrent));

    const packetSuffixMatch = packetNumber.match(/-([A-Z])$/);
    const isMainPacket = !packetSuffixMatch || packetSuffixMatch[1] === 'A';

    if (!isMainPacket) {
        setSuffix('');
        return;
    }

    if (adjustmentValue > 0) {
        if (originalCount > 0) {
            const suffixes = [];
            for (let i = 0; i < adjustmentValue; i++) {
                const nextSuffixCharCode = 'A'.charCodeAt(0) + originalCount + i;
                suffixes.push(String.fromCharCode(nextSuffixCharCode));
            }
            setSuffix(suffixes.join(', '));
        } else {
            setSuffix('');
        }
    } else if (adjustmentValue < 0) {
        if (originalCount > 0) {
            const suffixes = [];
            for (let i = 0; i < Math.abs(adjustmentValue); i++) {
                if (originalCount - 1 - i < 0) break; // Don't go below 'A'
                const charCode = 'A'.charCodeAt(0) + originalCount - 1 - i;
                suffixes.unshift(`-${String.fromCharCode(charCode)}`);
            }
            setSuffix(suffixes.join(', '));
        } else {
            setSuffix('');
        }
    } else { // adjustmentValue is 0
        if (originalCount > 1) {
            const suffixes = [];
            for (let i = 0; i < originalCount; i++) {
                const charCode = 'A'.charCodeAt(0) + i;
                suffixes.push(String.fromCharCode(charCode));
            }
            setSuffix(suffixes.join(', '));
        } else {
            setSuffix('');
        }
    }
  }, [originalCount, adjustmentValue, packetNumber]);
  
  const resetForm = () => {
    setPacketNumber('');
    setVajan('');
    setOriginalPcs('');
    setAdjustment('');
    setSuffix('');
    setCurrentPcs('');
    setPendingJiramId(null);
    setPendingMinusScanId(null);
    // Do not reset kapan number by default, handled by Esc
  }
  
  const fullReset = () => {
    resetForm();
    setKapanNumber('');
    setKapanFilter('');
    setScanSearchTerm('');
    setHistorySearchTerm('');
    setLiveSearchTerm('');
    toast({ title: 'Form Reset', description: 'All fields and filters have been cleared.' });
  }

  const handleSave = async (showToast = true) => {
    const { firestore, kapanNumber, packetNumber, vajan, originalPcs, currentPcs, suffix, adjustment, pendingJiramId, pendingMinusScanId, stationName } = stateRef.current;
    if (!firestore) {
        if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
        return false;
    }
    
    if(!kapanNumber || !packetNumber || !vajan || !originalPcs || !currentPcs) {
        if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
        return false;
    }

    try {
        await addDoc(collection(firestore, 'chaluEntries'), {
            kapanNumber,
            packetNumber,
            vajan: parseFloat(vajan) || 0,
            originalPcs: parseInt(originalPcs, 10) || 0,
            adjustment: parseInt(adjustment, 10) || 0,
            suffix,
            currentPcs: parseInt(currentPcs, 10) || 0,
            createdAt: serverTimestamp(),
            isReturned: false,
            returnedPackets: [],
            pendingJiramId: pendingJiramId || null,
            pendingMinusScanId: pendingMinusScanId || null,
            createdByStation: stationName || 'Unknown',
        });
        
        if(showToast) toast({ title: 'Success', description: 'Chalu entry saved successfully.' });
        resetForm();
        return true;

    } catch (e) {
        console.error('Error adding document: ', e);
        if(showToast) toast({ variant: 'destructive', title: 'Error', description: 'Could not save the entry.' });
        return false;
    }
  };
  
  const handleScanPacketClick = (scanEntry: CombinedScanEntry) => {
     if (scanSelectionMode) {
        handleScanRowSelect(scanEntry.id, !selectedScans.has(scanEntry.id));
        return;
    }

    setKapanNumber(scanEntry.kapanNumber);
    setPacketNumber(scanEntry.packetNumber);
    setSuffix(scanEntry.suffix || '');
    setAdjustment(scanEntry.type === 'minus' ? '-1' : '');
    setPendingJiramId(scanEntry.type === 'jiram' ? scanEntry.id : null);
    setPendingMinusScanId(scanEntry.type === 'minus' ? scanEntry.id : null);
    setLastClickedJiramId(scanEntry.id);
    setTimeout(() => setLastClickedJiramId(null), 500);
  }

  const handleEditClick = (entry: any) => {
    setEditingId(entry.id);
    setEditFormData({ ...entry });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };
  
  const handleSaveEdit = async (id: string, showToast = true) => {
      const { firestore, editFormData, stationName } = stateRef.current;
    if (!firestore) return false;
    const docRef = doc(firestore, 'chaluEntries', id);
    const { id: _, ...dataToSave } = editFormData; // Exclude id from data
    
    dataToSave.vajan = parseFloat(dataToSave.vajan) || 0;
    dataToSave.originalPcs = parseInt(dataToSave.originalPcs, 10) || 0;
    dataToSave.adjustment = parseInt(dataToSave.adjustment, 10) || 0;
    dataToSave.currentPcs = parseInt(dataToSave.currentPcs, 10) || 0;
    dataToSave.createdByStation = dataToSave.createdByStation || stationName || 'Unknown'; // Persist original station if exists

    try {
      await updateDoc(docRef, dataToSave);
      if(showToast) toast({ title: 'Updated', description: 'Entry updated successfully.'});
      handleCancelEdit();
      return true;
    } catch(e) {
      console.error("Error updating document:", e);
      if(showToast) toast({ variant: 'destructive', title: 'Update Failed' });
      return false;
    }
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleDeleteEntry = async (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'chaluEntries', id);
    try {
        await deleteDoc(docRef);
        toast({ title: 'Deleted', description: 'Entry removed successfully.'});
    } catch (e) {
        console.error("Error deleting document:", e);
        toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  }

  const handleOpenReturnDialog = (entry: ChaluEntry) => {
      setEntryToReturn(entry);
      setScannedReturnPackets(new Set(entry.returnedPackets || []));
      setReturnScanInput('');
      setReturnDialogOpen(true);
      setTimeout(() => returnScanInputRef.current?.focus(), 100);
  };
  
    const expectedReturnPackets = useMemo(() => {
        if (!entryToReturn) return [];
        
        const basePacketNumber = entryToReturn.packetNumber.split('-')[0];
        const baseBarcode = `R${entryToReturn.kapanNumber}-${basePacketNumber}`;

        let packets: string[] = [];

        // Always add the main packet itself
        packets.push(`R${entryToReturn.kapanNumber}-${entryToReturn.packetNumber}`);

        // Add suffix packets if they exist
        const suffixString = entryToReturn.suffix || '';
        if (suffixString) {
            const plusSuffixes = suffixString.split(',').map(s => s.trim()).filter(Boolean);
            plusSuffixes.forEach(suffix => {
                // Suffixes for negative adjustments might already contain a hyphen
                if (suffix.startsWith('-')) {
                    packets.push(`${baseBarcode}${suffix}`);
                } else {
                    packets.push(`${baseBarcode}-${suffix}`);
                }
            });
        }
        
        return [...new Set(packets)];
    }, [entryToReturn]);

  const allPacketsScanned = useMemo(() => {
    if (!entryToReturn) return false;
    const expected = expectedReturnPackets;
    if (expected.length === 0) return true;
    return expected.every(p => scannedReturnPackets.has(p));
  }, [entryToReturn, scannedReturnPackets, expectedReturnPackets]);

  const handleReturnScanSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!returnScanInput || !entryToReturn || allPacketsScanned) return;
      
      const expected = expectedReturnPackets;
      if (expected.includes(returnScanInput)) {
        if (scannedReturnPackets.has(returnScanInput)) {
            toast({ variant: 'destructive', title: 'Duplicate Scan', description: 'This packet has already been scanned.' });
        } else {
            setScannedReturnPackets(prev => new Set(prev).add(returnScanInput));
        }
        setReturnScanInput('');
      } else {
          toast({ variant: 'destructive', title: 'Incorrect Packet', description: `This packet is not expected for this entry.` });
          setReturnScanInput(''); // Clear on incorrect scan
      }
  }

  const handleRemoveScannedReturn = (barcode: string) => {
      setScannedReturnPackets(prev => {
          const newSet = new Set(prev);
          newSet.delete(barcode);
          return newSet;
      });
  }

  const handleConfirmReturn = async () => {
    if (!firestore || !entryToReturn) return;
    
    if (!allPacketsScanned) {
        toast({ variant: "destructive", title: "Scan Incomplete", description: "You must scan all expected packets before confirming." });
        return;
    }
    
    const docRef = doc(firestore, 'chaluEntries', entryToReturn.id);
    try {
        await updateDoc(docRef, {
            isReturned: true,
            returnDate: new Date().toISOString(),
            returnedPackets: Array.from(scannedReturnPackets),
            returnedByStation: stationName || 'Unknown',
        });

        if (entryToReturn.pendingJiramId) {
            await deleteDoc(doc(firestore, 'jiramEntries', entryToReturn.pendingJiramId));
        }
        if (entryToReturn.pendingMinusScanId) {
            await deleteDoc(doc(firestore, 'minusScanEntries', entryToReturn.pendingMinusScanId));
        }
        
        toast({ title: 'Entry Returned', description: `${entryToReturn.packetNumber} marked as returned.`});
        setReturnDialogOpen(false);
        if (refetchChaluEntries) refetchChaluEntries();
    } catch(e) {
        console.error('Error returning entry:', e);
        toast({ variant: 'destructive', title: 'Return Failed' });
    }
  };


  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fullReset();
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFullscreen(true);
    const autoSave = async () => {
        const { kapanNumber, packetNumber, editingId } = stateRef.current;
        if (kapanNumber && packetNumber) {
            const success = await handleSave(false);
            if (success) {
                stateRef.current.toast({ title: 'Auto-saved', description: 'New entry was automatically saved.' });
            }
        }
        if (editingId) {
            const success = await handleSaveEdit(editingId, false);
            if (success) {
                stateRef.current.toast({ title: 'Auto-saved', description: 'Your changes were automatically saved.' });
            }
        }
    };
    return () => {
        autoSave();
        setFullscreen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleToggleFullscreen = () => {
      if (isFullscreen) {
          router.push('/');
      }
      setFullscreen(!isFullscreen);
  };

  const filteredEntries = useMemo(() => {
    if (!chaluEntries) return [];
    let baseFilter = chaluEntries;

    if (viewMode === 'live') {
        baseFilter = chaluEntries.filter(entry => entry.isReturned !== true);
        if (kapanFilter) {
            baseFilter = baseFilter.filter(entry => entry.kapanNumber === kapanFilter);
        }
        if (liveSearchTerm) {
            baseFilter = baseFilter.filter(entry => entry.packetNumber.toLowerCase().includes(liveSearchTerm.toLowerCase()));
        }
    } else { // history mode
        baseFilter = chaluEntries.filter(entry => entry.isReturned === true);
        if (kapanFilter) {
            baseFilter = baseFilter.filter(entry => entry.kapanNumber === kapanFilter);
        }
        if (historySearchTerm) {
            baseFilter = baseFilter.filter(entry => entry.packetNumber.toLowerCase().includes(historySearchTerm.toLowerCase()));
        }
    }
    
    return baseFilter;
  }, [chaluEntries, kapanFilter, viewMode, historySearchTerm, liveSearchTerm]);
  
  useEffect(() => {
    setSelectedEntries(new Set());
  }, [kapanFilter, liveSearchTerm, historySearchTerm, viewMode]);

  const reportSummary = useMemo(() => {
    if (!kapanFilter || filteredEntries.length === 0) return null;
    
    let totalPlus = 0;
    let totalMinus = 0;
    let totalVajan = 0;

    filteredEntries.forEach(entry => {
        if (entry.kapanNumber === kapanFilter) {
            totalVajan += entry.vajan || 0;
            if (entry.adjustment > 0) {
                totalPlus += entry.adjustment;
            } else {
                totalMinus += entry.adjustment;
            }
        }
    });

    return {
        totalPlus,
        totalMinus,
        totalVajan: totalVajan.toFixed(3),
        totalEntries: filteredEntries.length,
        entries: filteredEntries.sort((a,b) => (a.packetNumber || '').localeCompare(b.packetNumber || '')),
    };
  }, [filteredEntries, kapanFilter]);
  
  const jiramChaluMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!chaluEntries) return map;
    chaluEntries.forEach(entry => {
        if (entry.pendingJiramId && !entry.isReturned) {
            map.set(entry.pendingJiramId, entry.id);
        }
         if (entry.pendingMinusScanId && !entry.isReturned) {
            map.set(entry.pendingMinusScanId, entry.id);
        }
    });
    return map;
  }, [chaluEntries]);


  const filteredScans = useMemo(() => {
    const jiram: CombinedScanEntry[] = (jiramEntries || []).map(e => ({ ...e, type: 'jiram' }));
    const minus: CombinedScanEntry[] = (minusScanEntries || []).map(e => ({ ...e, type: 'minus' }));
    
    let combined = [...jiram, ...minus];
    
    const returnedJiramIds = new Set(chaluEntries?.filter(c => c.isReturned && c.pendingJiramId).map(c => c.pendingJiramId));
    const returnedMinusIds = new Set(chaluEntries?.filter(c => c.isReturned && c.pendingMinusScanId).map(c => c.pendingMinusScanId));

    combined = combined.filter(scan => {
        const isReturned = scan.type === 'jiram' ? returnedJiramIds.has(scan.id) : returnedMinusIds.has(scan.id);
        if (isReturned) return false;

        const kapanMatch = !kapanNumber || scan.kapanNumber === kapanNumber;
        const searchMatch = !scanSearchTerm || scan.packetNumber.toLowerCase().includes(scanSearchTerm.toLowerCase());
        const typeMatch = scanFilter === 'all' || scan.type === scanFilter;

        return kapanMatch && searchMatch && typeMatch;
    });

    if (scanSort === 'numeric') {
        combined.sort((a, b) => a.packetNumber.localeCompare(b.packetNumber, undefined, { numeric: true }));
    } else { // recent
        combined.sort((a, b) => b.scanTime.seconds - a.scanTime.seconds);
    }
    
    return combined;

  }, [jiramEntries, minusScanEntries, chaluEntries, kapanNumber, scanSearchTerm, scanFilter, scanSort]);
  

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!firestore) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            const data: {barcode: string, kapanNumber: string}[] = JSON.parse(text);

            if (!Array.isArray(data) || data.length === 0) {
                toast({ variant: 'destructive', title: 'Import Error', description: 'File is empty or not in the correct format.' });
                return;
            }
            
            toast({ title: 'Importing...', description: `Processing ${data.length} packets. This may take a moment.` });

            const allJiramDocs = await getDocs(collection(firestore, 'jiramEntries'));
            const deleteBatch = writeBatch(firestore);
            allJiramDocs.forEach(doc => deleteBatch.delete(doc.ref));
            await deleteBatch.commit();
            
            const addBatch = writeBatch(firestore);
            data.forEach(item => {
                const match = item.barcode.match(/^(?:R)?(\d+)-(\d+(?:-[A-Z])?)$/);
                if (match) {
                    const [, , packetIdentifier] = match;
                    const [, suffix] = packetIdentifier.split('-');
                     const newDocRef = doc(firestore, 'jiramEntries', item.barcode);
                     addBatch.set(newDocRef, {
                        barcode: item.barcode,
                        kapanNumber: item.kapanNumber,
                        packetNumber: packetIdentifier,
                        suffix: suffix || '',
                        scanTime: serverTimestamp(),
                     });
                }
            });
            await addBatch.commit();
            
            toast({ title: 'Import Successful', description: `Successfully imported ${data.length} Jiram scans.` });
            if (refetchJiramEntries) refetchJiramEntries();
        } catch (error) {
            console.error("Import failed:", error);
            toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not read or process the file.' });
        } finally {
            if(importFileRef.current) importFileRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };
  
  const uniqueKapansForFilter = useMemo(() => {
      if (!chaluEntries) return [];
      const unique = new Set(chaluEntries.map(e => e.kapanNumber));
      return Array.from(unique).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [chaluEntries]);
  
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
      if (checked === true) {
          const allIds = new Set(filteredEntries.map(e => e.id));
          setSelectedEntries(allIds);
      } else {
          setSelectedEntries(new Set());
      }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
      const newSelection = new Set(selectedEntries);
      if (checked) {
          newSelection.add(id);
      } else {
          newSelection.delete(id);
      }
      setSelectedEntries(newSelection);
  };
  
  const handleDeleteSelected = async () => {
    if (!firestore || selectedEntries.size === 0) return;

    const batch = writeBatch(firestore);
    selectedEntries.forEach(id => {
        const docRef = doc(firestore, 'chaluEntries', id);
        batch.delete(docRef);
    });

    try {
        await batch.commit();
        toast({ title: 'Success', description: `${selectedEntries.size} entries deleted.`});
        setSelectedEntries(new Set());
        setLiveSelectionMode(false);
    } catch(e) {
        console.error("Batch delete failed:", e);
        toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  }

  const isAllSelected = filteredEntries.length > 0 && selectedEntries.size === filteredEntries.length;
  const isSomeSelected = selectedEntries.size > 0 && selectedEntries.size < filteredEntries.length;
  
    const handleScanSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            const allIds = new Set(filteredScans.map(e => e.id));
            setSelectedScans(allIds);
        } else {
            setSelectedScans(new Set());
        }
    };

    const handleScanRowSelect = (id: string, checked: boolean) => {
        const newSelection = new Set(selectedScans);
        if (checked) {
            newSelection.add(id);
        } else {
            newSelection.delete(id);
        }
        setSelectedScans(newSelection);
    };
    
    const handleDeleteSelectedScans = async () => {
        if (!firestore || selectedScans.size === 0) return;

        const batch = writeBatch(firestore);
        selectedScans.forEach(id => {
            const entry = filteredScans.find(s => s.id === id);
            if (entry) {
                const collectionName = entry.type === 'jiram' ? 'jiramEntries' : 'minusScanEntries';
                const docRef = doc(firestore, collectionName, id);
                batch.delete(docRef);
            }
        });

        try {
            await batch.commit();
            toast({ title: 'Success', description: `${selectedScans.size} pending scans deleted.`});
            setSelectedScans(new Set());
            setScanSelectionMode(false);
        } catch(e) {
            console.error("Scan batch delete failed:", e);
            toast({ variant: 'destructive', title: 'Delete Failed' });
        }
    };

    useEffect(() => {
        setSelectedScans(new Set());
    }, [kapanNumber, scanSearchTerm]);

  const kapanCounts = useMemo(() => {
    if (!kapanFilter) return { pending: 0, live: 0, returned: 0, minus: 0 };
    
    const allChaluForKapan = chaluEntries?.filter(c => c.kapanNumber === kapanFilter) || [];
    const returnedChalu = allChaluForKapan.filter(c => c.isReturned);
    const liveChalu = allChaluForKapan.filter(c => !c.isReturned);
    const liveChaluJiramIds = new Set(liveChalu.map(c => c.pendingJiramId));
    const liveChaluMinusIds = new Set(liveChalu.map(c => c.pendingMinusScanId));

    const allJiramForKapan = jiramEntries?.filter(j => j.kapanNumber === kapanFilter) || [];
    const returnedJiramIds = new Set(returnedChalu.map(c => c.pendingJiramId));
    const pendingJiram = allJiramForKapan.filter(j => !liveChaluJiramIds.has(j.id) && !returnedJiramIds.has(j.id));
    
    const allMinusForKapan = minusScanEntries?.filter(m => m.kapanNumber === kapanFilter) || [];
    const returnedMinusIds = new Set(returnedChalu.map(c => c.pendingMinusScanId));
    const pendingMinus = allMinusForKapan.filter(m => !liveChaluMinusIds.has(m.id) && !returnedMinusIds.has(m.id));

    return {
        pending: pendingJiram.length,
        live: liveChalu.length,
        returned: returnedChalu.length,
        minus: pendingMinus.length,
    }
  }, [kapanFilter, jiramEntries, minusScanEntries, chaluEntries]);
  
  const isAllScansSelected = filteredScans.length > 0 && selectedScans.size === filteredScans.length;
  const isSomeScansSelected = selectedScans.size > 0 && selectedScans.size < filteredScans.length;

  const handleSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // If the user just typed a letter, add a comma and space
    if (value.length > suffix.length && /^[A-Z]$/.test(value.slice(-1))) {
      setSuffix(value + ', ');
    } else {
      setSuffix(value);
    }
  };


  return (
    <div className="grid lg:grid-cols-[1fr,500px] gap-6 p-6 h-screen overflow-hidden">
      <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <PageHeader title="નુકશાની/ફાટેલા એન્ટ્રી" description="કાપણ પ્રમાણે નુકશાની ની યાદી." />
            <Button variant="ghost" size="icon" onClick={handleToggleFullscreen}>
                {isFullscreen ? <Minimize/> : <Maximize />}
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>ATIXE PRO</CardTitle>
              <CardDescription>Select a lot and enter the number of packets completed or adjusted today.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
                <div className="lg:col-span-1">
                  <label className="text-sm font-medium">કાપણ નંબર</label>
                  <Select value={kapanNumber} onValueChange={setKapanNumber}>
                      <SelectTrigger><SelectValue placeholder="કાપણ ?" /></SelectTrigger>
                      <SelectContent>
                      {kapans?.sort((a, b) => a.kapanNumber.localeCompare(b.kapanNumber, undefined, { numeric: true })).map(k => (
                          <SelectItem key={k.id} value={k.kapanNumber}>{k.kapanNumber}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                </div>
                <div className="lg:col-span-1">
                  <label className="text-sm font-medium">પેકેટ નંબર</label>
                  <Input 
                    value={packetNumber}
                    onChange={(e) => setPacketNumber(e.target.value.toUpperCase())}
                    placeholder="પેકેટ નંબર ?."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ઓ.થાન</label>
                  <Input 
                    type="number"
                    value={originalPcs}
                    onChange={(e) => setOriginalPcs(e.target.value)}
                    placeholder="ઓરિજિનલ કેટલા ?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">નુકશાની(+/-)</label>
                  <Input 
                    type="number" 
                    value={adjustment} 
                    onChange={(e) => setAdjustment(e.target.value)}
                    placeholder="e.g., -1 or 5"
                  />
                </div>
                 <div>
                  <label className="text-sm font-medium">પ્લસ/માઈનસ</label>
                  <Input 
                    value={suffix} 
                    onChange={handleSuffixChange}
                    placeholder="Auto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ટો.થાન</label>
                  <Input 
                    type="number"
                    value={currentPcs} 
                    onChange={(e) => setCurrentPcs(e.target.value)}
                    className="font-bold text-lg"
                  />
                </div>
                 <div>
                  <label className="text-sm font-medium">વજન(Weight)</label>
                  <Input 
                    type="number"
                    step="0.001"
                    value={vajan}
                    onChange={(e) => setVajan(e.target.value)}
                    placeholder="વજન લખો"
                  />
                </div>
              </div>
              <Button onClick={() => handleSave(true)} className="mt-4">
                <Save className="mr-2" /> Save
              </Button>
            </CardContent>
          </Card>
          
          <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {viewMode === 'live' ? 'અત્યાર સુધી ની એન્ટ્રી (Live)' : 'Return History'}
                      </CardTitle>
                      <CardDescription>
                          {viewMode === 'live' ? 'Live log of all chalu entries. Click a field to edit.' : 'Log of all returned chalu entries.'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                       <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'live' ? 'history' : 'live')}>
                            <History className="mr-2 h-4 w-4"/>
                            {viewMode === 'live' ? 'View History' : 'View Live'}
                       </Button>
                       <Select value={kapanFilter} onValueChange={(value) => setKapanFilter(value === 'all' ? '' : value)}>
                           <SelectTrigger className="w-[180px]">
                               <SelectValue placeholder="Filter by Kapan..."/>
                           </SelectTrigger>
                           <SelectContent>
                               <SelectItem value="all">Show All</SelectItem>
                               {uniqueKapansForFilter.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                           </SelectContent>
                       </Select>
                       {kapanFilter && (
                         <div className="flex items-center gap-4 text-sm font-medium border rounded-lg px-3 py-1.5 bg-muted/50">
                            <div title="Pending Jiram">J: <span className="font-bold">{kapanCounts.pending}</span></div>
                            <div title="Pending Minus">M: <span className="font-bold text-destructive">{kapanCounts.minus}</span></div>
                            <div title="Live Chalu">L: <span className="font-bold">{kapanCounts.live}</span></div>
                            <div title="Returned Chalu">R: <span className="font-bold text-green-600">{kapanCounts.returned}</span></div>
                         </div>
                       )}
                         <Dialog open={isReportOpen} onOpenChange={setReportOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={!kapanFilter || !reportSummary}>
                                    <FileText className="mr-2 h-4 w-4" /> Report
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Full Report for Kapan: {kapanFilter}</DialogTitle>
                                    <DialogDescription>A detailed summary and list of all entries for this Kapan.</DialogDescription>
                                </DialogHeader>
                                {reportSummary && (
                                    <>
                                        <div className="mb-4 border rounded-lg p-4 bg-muted/50">
                                            <h3 className="font-semibold text-lg mb-2">Summary</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm text-muted-foreground">Total Entries</p>
                                                    <p className="text-2xl font-bold">{reportSummary.totalEntries}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-muted-foreground">Total Weight</p>
                                                    <p className="text-2xl font-bold">{reportSummary.totalVajan}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-muted-foreground">Total Plus</p>
                                                    <p className="text-2xl font-bold text-green-600">+{reportSummary.totalPlus}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-muted-foreground">Total Minus</p>
                                                    <p className="text-2xl font-bold text-destructive">{reportSummary.totalMinus}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="max-h-[50vh] overflow-y-auto">
                                            <Table>
                                              <TableHeader>
                                                  <TableRow>
                                                      <TableHead>પેકેટ</TableHead>
                                                      <TableHead>ઓરિજિનલ</TableHead>
                                                      <TableHead>નુકશાની</TableHead>
                                                      <TableHead>પ્લસ/માઈનસ</TableHead>
                                                      <TableHead>ટોટલ</TableHead>
                                                      <TableHead>વજન</TableHead>
                                                  </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                  {reportSummary.entries.map(entry => (
                                                      <TableRow key={entry.id} className={cn(entry.adjustment < 0 && 'bg-destructive/10')}>
                                                          <TableCell>{entry.packetNumber}</TableCell>
                                                          <TableCell>{entry.originalPcs}</TableCell>
                                                          <TableCell className={cn(entry.adjustment > 0 ? "text-green-600" : entry.adjustment < 0 ? "text-destructive" : "", "font-semibold")}>
                                                              {entry.adjustment > 0 ? `+${entry.adjustment}` : entry.adjustment}
                                                          </TableCell>
                                                          <TableCell>{entry.suffix}</TableCell>
                                                          <TableCell className="font-bold">{entry.currentPcs}</TableCell>
                                                          <TableCell>{entry.vajan}</TableCell>
                                                      </TableRow>
                                                  ))}
                                              </TableBody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </DialogContent>
                         </Dialog>
                    </div>
                  </div>
                    {viewMode === 'live' && (
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by packet number..."
                                        className="pl-8 sm:w-[200px]"
                                        value={liveSearchTerm}
                                        onChange={(e) => setLiveSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={() => {
                                    setLiveSelectionMode(!liveSelectionMode);
                                    if(liveSelectionMode) setSelectedEntries(new Set());
                                }}>
                                    <Rows className="mr-2 h-4 w-4" />
                                    {liveSelectionMode ? 'Cancel' : 'Select'}
                                </Button>
                                 {liveSelectionMode && selectedEntries.size > 0 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedEntries.size})
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Delete {selectedEntries.size} entries?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSelected}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                           
                        </div>
                    )}
                    {viewMode === 'history' && (
                         <div className="flex justify-between items-center mt-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by packet number..."
                                    className="pl-8 sm:w-[300px]"
                                    value={historySearchTerm}
                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                  {viewMode === 'live' ? (
                     <Table>
                      <TableHeader>
                          <TableRow>
                              {liveSelectionMode && (
                                <TableHead className="w-12">
                                    <Checkbox
                                    checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                                    onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                              )}
                              <TableHead>કાપણ</TableHead>
                              <TableHead>પેકેટ</TableHead>
                              <TableHead>ઓરિજિનલ થાન</TableHead>
                              <TableHead>નુકશાની(+/-)</TableHead>
                              <TableHead>પ્લસ/માઈનસ</TableHead>
                              <TableHead>ટો.થાન</TableHead>
                              <TableHead>વજન</TableHead>
                              <TableHead>Station</TableHead>
                              <TableHead>સુધારો</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {loadingEntries && <TableRow><TableCell colSpan={liveSelectionMode ? 10 : 9} className="text-center">Loading...</TableCell></TableRow>}
                          {!loadingEntries && filteredEntries.map(entry => (
                          <TableRow 
                            key={entry.id} 
                            className={cn(entry.adjustment < 0 && 'bg-destructive/10', selectedEntries.has(entry.id) && 'bg-accent/50')}
                          >
                            {liveSelectionMode && (
                                <TableCell>
                                    <Checkbox checked={selectedEntries.has(entry.id)} onCheckedChange={(checked) => handleRowSelect(entry.id, !!checked)} />
                                </TableCell>
                            )}
                            {editingId === entry.id ? (
                                <>
                                    <TableCell><Input name="kapanNumber" value={editFormData.kapanNumber} onChange={handleEditFormChange} /></TableCell>
                                    <TableCell><Input name="packetNumber" value={editFormData.packetNumber} onChange={handleEditFormChange} /></TableCell>
                                    <TableCell><Input type="number" name="originalPcs" value={editFormData.originalPcs} onChange={handleEditFormChange} /></TableCell>
                                    <TableCell><Input type="number" name="adjustment" value={editFormData.adjustment} onChange={handleEditFormChange} /></TableCell>
                                    <TableCell><Input name="suffix" value={editFormData.suffix} onChange={handleEditFormChange} /></TableCell>
                                    <TableCell><Input type="number" name="currentPcs" value={editFormData.currentPcs} onChange={handleEditFormChange} /></TableCell>
                                    <TableCell><Input type="number" step="0.001" name="vajan" value={editFormData.vajan} onChange={handleEditFormChange} /></TableCell>
                                    <TableCell>{entry.createdByStation}</TableCell>
                                    <TableCell>
                                        <Button size="sm" onClick={() => handleSaveEdit(entry.id, true)}><Save className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                                    </TableCell>
                                </>
                            ) : (
                                 <>
                                    <TableCell>{entry.kapanNumber}</TableCell>
                                    <TableCell>{entry.packetNumber}</TableCell>
                                    <TableCell>{entry.originalPcs}</TableCell>
                                    <TableCell className={cn(entry.adjustment > 0 ? "text-green-600" : entry.adjustment < 0 ? "text-destructive" : "", "font-semibold")}>
                                      {entry.adjustment > 0 ? `+${entry.adjustment}` : entry.adjustment}
                                    </TableCell>
                                    <TableCell>{entry.suffix}</TableCell>
                                    <TableCell className="font-bold">{entry.currentPcs}</TableCell>
                                    <TableCell>{entry.vajan}</TableCell>
                                    <TableCell><Badge variant="outline">{entry.createdByStation}</Badge></TableCell>
                                    <TableCell className="flex gap-1">
                                        <button className="uiverse-return-button" onClick={() => handleOpenReturnDialog(entry)}>
                                          <div className="hoverEffect"><div></div></div>
                                          <span className="flex items-center gap-1">
                                            <Undo2 className="h-4 w-4" /> Return
                                          </span>
                                        </button>
                                        <Button size="sm" variant="outline" onClick={() => handleEditClick(entry)}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" className="w-9 p-0">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the entry for packet {entry.packetNumber}.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </>
                            )}
                          </TableRow>
                          ))}
                          {!loadingEntries && filteredEntries.length === 0 && (
                              <TableRow><TableCell colSpan={liveSelectionMode ? 10 : 9} className="text-center">No entries found.</TableCell></TableRow>
                          )}
                      </TableBody>
                     </Table>
                  ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kapan-Packet</TableHead>
                                <TableHead>Total PCS</TableHead>
                                <TableHead>Return Date</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Returned At</TableHead>
                                <TableHead>Packets Scanned</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loadingEntries && <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>}
                            {!loadingEntries && filteredEntries.map(entry => (
                                <TableRow key={entry.id} className="relative bg-green-100/60 dark:bg-green-900/30">
                                    <TableCell>
                                        <div className="font-bold">{entry.kapanNumber}-{entry.packetNumber}</div>
                                        <div className="text-xs text-muted-foreground">Entered: {entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'PP') : 'N/A'}</div>
                                    </TableCell>
                                    <TableCell>{entry.currentPcs}</TableCell>
                                    <TableCell>{entry.returnDate ? format(new Date(entry.returnDate), 'PPp') : 'N/A'}</TableCell>
                                    <TableCell><Badge variant="outline" className="gap-1.5"><Computer size={12}/>{entry.createdByStation}</Badge></TableCell>
                                    <TableCell><Badge variant="outline" className="gap-1.5"><Computer size={12}/>{entry.returnedByStation}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 max-w-xs">
                                          {(entry.returnedPackets || []).map(p => <span key={p} className="font-mono text-xs bg-black/10 dark:bg-white/10 px-1 rounded-sm">{p}</span>)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" className="w-9 p-0">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the entry for packet {entry.packetNumber}.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loadingEntries && filteredEntries.length === 0 && (
                              <TableRow><TableCell colSpan={7} className="text-center">No returned entries found.</TableCell></TableRow>
                          )}
                        </TableBody>
                    </Table>
                  )}
              </CardContent>
          </Card>
      </div>

       <Card className="flex flex-col h-full lg:max-h-full overflow-hidden">
         <CardHeader>
            <CardTitle>Pending Scans</CardTitle>
            <CardDescription>Packets from Jiram or Minus scans, ready for Chalu entry.</CardDescription>
            <div className="flex flex-wrap gap-2 items-center justify-between mt-4">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                      type="search" 
                      placeholder="Search packets..." 
                      className="pl-8 sm:w-[200px]"
                      value={scanSearchTerm}
                      onChange={(e) => setScanSearchTerm(e.target.value)}
                  />
              </div>

               <RadioGroup value={scanFilter} onValueChange={(v) => setScanFilter(v as any)} className="flex gap-1 bg-muted p-1 rounded-md">
                  <Label htmlFor="scan-all" className={cn("px-2 py-1 text-xs rounded-sm cursor-pointer", scanFilter === 'all' && 'bg-background shadow-sm')}>All</Label>
                  <RadioGroupItem value="all" id="scan-all" className="sr-only"/>
                  <Label htmlFor="scan-jiram" className={cn("px-2 py-1 text-xs rounded-sm cursor-pointer", scanFilter === 'jiram' && 'bg-background shadow-sm')}>Jiram</Label>
                  <RadioGroupItem value="jiram" id="scan-jiram" className="sr-only"/>
                  <Label htmlFor="scan-minus" className={cn("px-2 py-1 text-xs rounded-sm cursor-pointer", scanFilter === 'minus' && 'bg-background shadow-sm')}>Minus</Label>
                  <RadioGroupItem value="minus" id="scan-minus" className="sr-only"/>
              </RadioGroup>

              <div className="flex gap-2 items-center">
                   <Button variant="ghost" size="icon" onClick={() => setScanSort(scanSort === 'numeric' ? 'recent' : 'numeric')}>
                      {scanSort === 'numeric' ? <ArrowDownWideNarrow className="h-4 w-4"/> : <Clock className="h-4 w-4"/>}
                   </Button>

                  <Button variant="outline" size="sm" onClick={() => {
                      setScanSelectionMode(!scanSelectionMode);
                      if(scanSelectionMode) setSelectedScans(new Set());
                  }}>
                      <Rows className="mr-2 h-4 w-4" />
                      {scanSelectionMode ? 'Cancel' : 'Select'}
                  </Button>

                  {scanSelectionMode && selectedScans.size > 0 && (
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                  <Trash2 className="mr-2 h-4 w-4" /> ({selectedScans.size})
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete {selectedScans.size} pending scans?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSelectedScans}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  )}
                  
                  <Button variant="outline" size="sm" onClick={() => importFileRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Import
                      <input type="file" ref={importFileRef} accept=".json" className="hidden" onChange={handleImport} />
                  </Button>
              </div>
            </div>
         </CardHeader>
         <CardContent className="flex-1 overflow-y-auto">
             {(loadingJiramEntries || loadingMinusScans) ? <p>Loading...</p> : (
                 <Table>
                     <TableHeader>
                         <TableRow>
                             {scanSelectionMode && (
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={isAllScansSelected ? true : isSomeScansSelected ? 'indeterminate' : false}
                                        onCheckedChange={handleScanSelectAll}
                                    />
                                </TableHead>
                             )}
                             <TableHead>Kapan</TableHead>
                             <TableHead>Packet</TableHead>
                             <TableHead>Type</TableHead>
                             <TableHead>Action</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         {filteredScans.map(entry => {
                            const isInProgress = jiramChaluMap.has(entry.id);
                            return (
                             <TableRow 
                                key={entry.id} 
                                className={cn(
                                    "transition-colors duration-300", 
                                    (pendingJiramId === entry.id || pendingMinusScanId === entry.id) && "bg-accent",
                                    lastClickedJiramId === entry.id && 'animate-pulse bg-accent/50',
                                    selectedScans.has(entry.id) && 'bg-accent/50',
                                    isInProgress ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                )}
                                onClick={() => !isInProgress && handleScanPacketClick(entry)}
                              >
                                 {scanSelectionMode && (
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox checked={selectedScans.has(entry.id)} onCheckedChange={(checked) => handleScanRowSelect(entry.id, !!checked)} />
                                    </TableCell>
                                 )}
                                 <TableCell>{entry.kapanNumber}</TableCell>
                                 <TableCell>{entry.packetNumber}</TableCell>
                                 <TableCell>
                                    <Badge variant={entry.type === 'jiram' ? 'secondary' : 'destructive'}>{entry.type}</Badge>
                                 </TableCell>
                                 <TableCell onClick={(e) => e.stopPropagation()}>
                                    {isInProgress ? <Badge variant="outline">In Progress</Badge> : (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive/70"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Pending Scan?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will remove "{entry.barcode}" from the pending list.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteDoc(doc(firestore, entry.type === 'jiram' ? 'jiramEntries' : 'minusScanEntries', entry.id))}>Delete Scan</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                 </TableCell>
                             </TableRow>
                         )})}
                         {filteredScans.length === 0 && (
                             <TableRow><TableCell colSpan={scanSelectionMode ? 5 : 4} className="text-center text-muted-foreground">
                                {kapanNumber || scanSearchTerm ? 'No matching scans found.' : 'Select a Kapan to see pending scans.'}
                             </TableCell></TableRow>
                         )}
                     </TableBody>
                 </Table>
             )}
         </CardContent>
      </Card>
      
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Return Entry: {entryToReturn?.kapanNumber} - {entryToReturn?.packetNumber}</DialogTitle>
                <DialogDescription>Scan all {expectedReturnPackets.length} physical packets that are being returned to close this entry.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                 <div>
                    <form onSubmit={handleReturnScanSubmit} className="flex flex-col gap-2">
                        <Input
                            ref={returnScanInputRef}
                            placeholder="Scan packet barcode..."
                            value={returnScanInput}
                            onChange={e => setReturnScanInput(e.target.value)}
                            disabled={allPacketsScanned}
                        />
                        <Button type="submit" disabled={allPacketsScanned}>Add</Button>
                    </form>
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Scanned Packets ({scannedReturnPackets.size})</h4>
                        <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                            {Array.from(scannedReturnPackets).map(p => (
                                <div key={p} className="flex justify-between items-center bg-muted/50 p-1.5 rounded-sm">
                                    <span className="font-mono text-sm">{p}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveScannedReturn(p)}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold mb-2">Expected Packets ({expectedReturnPackets.length})</h4>
                     <div className="border rounded-md p-2 space-y-1 max-h-60 overflow-y-auto">
                        {expectedReturnPackets.map(p => (
                            <div key={p} className={cn("flex items-center gap-2 text-sm p-1.5 rounded-sm", scannedReturnPackets.has(p) && 'bg-green-100 dark:bg-green-900/30')}>
                                {scannedReturnPackets.has(p) ? <Check className="h-4 w-4 text-green-600"/> : <Circle className="h-4 w-4 text-muted-foreground"/>}
                                <span className="font-mono">{p}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmReturn} disabled={!allPacketsScanned}>Confirm Return</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    

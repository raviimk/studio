
'use client';

import { 
    SARIN_PACKETS_KEY, 
    LASER_LOTS_KEY, 
    FOURP_TECHING_LOTS_KEY, 
    UHDHA_PACKETS_KEY, 
    JIRAM_REPORT_PACKETS_KEY,
    CHALU_ENTRIES_KEY,
    JIRAM_ENTRIES_KEY,
    KAPANS_KEY
} from './constants';
import * as T from './types';

// Helper to get and parse data from localStorage
function getStoredData<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error(`Error reading or parsing localStorage key "${key}":`, error);
        return [];
    }
}

// Helper to save data to localStorage
function setStoredData<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
    }
}

// Helper to get kapan number from a Udhda packet barcode
const getKapanFromBarcode = (barcode: string): string | null => {
  const match = barcode.match(/^(?:R)?(\d+)/);
  return match ? match[1] : null;
};


/**
 * Deletes all data associated with a specific Kapan number from localStorage.
 * @param kapanNumber The Kapan number to delete.
 */
export function deleteKapanData(kapanNumber: string): void {
    if (!kapanNumber) return;

    // 1. Filter Sarin Packets
    const sarinPackets = getStoredData<T.SarinPacket>(SARIN_PACKETS_KEY);
    const updatedSarinPackets = sarinPackets.filter(p => p.kapanNumber !== kapanNumber);
    setStoredData(SARIN_PACKETS_KEY, updatedSarinPackets);

    // 2. Filter Laser Lots
    const laserLots = getStoredData<T.LaserLot>(LASER_LOTS_KEY);
    const updatedLaserLots = laserLots.filter(lot => lot.kapanNumber !== kapanNumber);
    setStoredData(LASER_LOTS_KEY, updatedLaserLots);

    // 3. Filter 4P Teching Lots
    const fourPTechingLots = getStoredData<T.FourPLot>(FOURP_TECHING_LOTS_KEY);
    const updatedFourPLots = fourPTechingLots.filter(lot => lot.kapan !== kapanNumber);
    setStoredData(FOURP_TECHING_LOTS_KEY, updatedFourPLots);

    // 4. Filter Udhda Packets
    const udhdhaPackets = getStoredData<T.UdhdaPacket>(UHDHA_PACKETS_KEY);
    const updatedUdhdaPackets = udhdhaPackets.filter(p => getKapanFromBarcode(p.barcode) !== kapanNumber);
    setStoredData(UHDHA_PACKETS_KEY, updatedUdhdaPackets);
    
    // 5. Filter Jiram Report Packets
    const jiramPackets = getStoredData<T.JiramReportPacket>(JIRAM_REPORT_PACKETS_KEY);
    const updatedJiramPackets = jiramPackets.filter(p => p.kapanNumber !== kapanNumber);
    setStoredData(JIRAM_REPORT_PACKETS_KEY, updatedJiramPackets);

    // 6. Filter Chalu Entry Data
    const chaluEntries = getStoredData<T.ChaluEntry>(CHALU_ENTRIES_KEY);
    const updatedChaluEntries = chaluEntries.filter(p => p.kapanNumber !== kapanNumber);
    setStoredData(CHALU_ENTRIES_KEY, updatedChaluEntries);
    
    const jiramEntries = getStoredData<T.JiramEntry>(JIRAM_ENTRIES_KEY);
    const updatedJiramEntries = jiramEntries.filter(p => p.kapanNumber !== kapanNumber);
    setStoredData(JIRAM_ENTRIES_KEY, updatedJiramEntries);

    const kapans = getStoredData<T.Kapan>(KAPANS_KEY);
    const updatedKapans = kapans.filter(p => p.kapanNumber !== kapanNumber);
    setStoredData(KAPANS_KEY, updatedKapans);


    // NOTE: We are not touching operator/mapping/settings keys as they are not Kapan-specific.
    // REASSIGN_LOGS_KEY is also not touched as it would require complex lookups and might be better to keep for historical auditing.
}

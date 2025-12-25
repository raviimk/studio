

export interface SarinPacket {
  id: string;
  senderName: string;
  operator: string;
  machine: string;
  kapanNumber: string;
  lotNumber: string;
  mainPacketNumber: number; // This is the count of main packets
  sarinMainPackets?: ScannedPacket[]; // The actual main packets from Laser Lot
  packetCount: number;
  hasJiram: boolean;
  jiramCount?: number;
  date: string;
  time: string;
  isReturned: boolean;
  returnedBy?: string;
  returnDate?: string;
  scannedReturnPackets?: ScannedPacket[];
}

export interface SarinOperator {
    id: string;
    name: string;
}

export interface SarinMapping {
    id: string;
    operatorId: string;
    operatorName: string;
    machine: string;
}

export interface LaserLot {
  id: string;
  lotNumber: string;
  kapanNumber: string;
  tensionType: string;
  machine: string;
  packetCount: number;
  subPacketCount?: number;
  scannedPackets?: ScannedPacket[];
  entryDate: string;
  isReturned: boolean;
  returnedBy?: string;
  returnDate?: string;
}

export interface ScannedPacket {
    id: string;
    fullBarcode: string;
    kapanNumber: string;
    packetNumber: string;
    suffix: string;
}


export interface LaserOperator {
    id: string;
    name: string;
}

export interface LaserMapping {
    id: string;
    tensionType: string;
    machine: string;
}

export interface ReassignLog {
    id: string;
    date: string;
    fromOperator: string;
    toOperator: string;
    packets: { 
        mainPacketNumber: number;
        lotNumber: string;
        quantityTransferred: number; 
    }[];
}

export interface FourPOperator {
    id: string;
    name: string;
}

export interface FourPTechingOperator {
    id: string;
    name: string;
    isDefault?: boolean;
}

export interface PriceMaster {
    fourP: number;
    fourPTeching: number;
}

export interface FourPRate {
    id: string;
    from: number;
    to: number;
    rate: number;
}

export interface FourPData {
    operator: string;
    pcs: number;
    amount: number;
}

export interface FourPLot {
    id: string;
    kapan: string;
    lot: string;
    carat: number;
    department: string;
    pcs: number;
    blocking: number;
    finalPcs: number;
    techingOperator: string;
    techingAmount: number;
    entryDate: string;
    isReturnedToFourP: boolean;
    fourPOperator?: string; // Legacy support, use fourPData instead
    fourPAmount?: number;   // Legacy support, use fourPData instead
    fourPData?: FourPData[];
    returnDate?: string;
}

export interface UdhdaPacket {
    id: string;
    barcode: string;
    type: 'sarin' | 'laser';
    operator: string;
    assignmentTime: string;
    isReturned: boolean;
    returnTime?: string;
}

export interface UdhdaSettings {
    returnTimeLimitMinutes: number;
}

export interface FourPDepartmentSettings {
    caratThreshold: number;
    aboveThresholdDeptName: string;
    belowThresholdDeptName: string;
}

export interface JiramReportPacket {
    id: string;
    barcode: string;
    kapanNumber: string;
    scanTime: string;
}

export interface BoxSortingRange {
    id: string;
    from: number;
    to: number;
    label: string;
}

export interface BoxDiameterRange {
    id: string;
    from: number;
    to: number;
    label: string;
}

export interface BoxSortingPacket {
    id: string;
    barcode: string;
    packetNumber: string;
    shape: string;
    roughWeight: number;
    polishWeight: number;
    diameter?: number;
    boxLabel: string;
    scanTime: string;
}

export interface AutoBackupSettings {
    intervalHours: number;
    officeEndTime: string;
    lastBackupTimestamp?: number;
    lastMasterBackupDate?: string;
}

export interface ReturnScanSettings {
    sarin: boolean;
    laser: boolean;
}

export interface ProductionEntry {
    operator: string;
    lotNumber: string;
    kapanNumber: string;
    pcs: number;
    packetId: string;
}

export interface ProductionHistory {
    [date: string]: ProductionEntry[];
}

export interface SystemSettings {
  youtubeLink: string;
  videoStartTime?: string;
  videoEndTime?: string;
  autoCreateLaserLot?: boolean;
  autoCreateLaserLotDelay?: number;
}

// Chalu Entry Types
export type Kapan = {
    id: string;
    kapanNumber: string;
};

export type JiramEntry = {
    id: string;
    barcode: string;
    kapanNumber: string;
    packetNumber: string;
    suffix: string;
    scanTime: string;
}

export type ChaluEntry = {
    id: string;
    kapanNumber: string;
    packetNumber: string;
    vajan: number;
    originalPcs: number;
    adjustment: number;
    suffix: string;
    currentPcs: number;
    isReturned?: boolean;
    returnedPackets?: string[];
    createdAt: string;
    returnDate?: string;
};

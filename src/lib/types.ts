

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

export interface ScannedPacket {
  id: string;
  kapanNumber: string;
  packetNumber: string;
  suffix: string;
  fullBarcode: string;
}

export interface LaserLot {
  id:string;
  lotNumber: string;
  tensionType: string;
  machine: string;
  kapanNumber: string;
  packetCount: number;
  entryDate: string;
  isReturned: boolean;
  returnedBy?: string;
  returnDate?: string;
  scannedPackets?: ScannedPacket[];
}

export interface SarinOperator {
  id: string;
  name: string;
}

export interface LaserOperator {
  id: string;
  name: string;
}

export interface SarinMapping {
  id: string;
  operatorId: string;
  operatorName: string;
  machine: string;
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
  packets: { mainPacketNumber: number; lotNumber: string; quantityTransferred: number }[];
}

// 4P & 4P Teching Types
export interface FourPOperator {
  id: string;
  name: string;
}

export interface FourPTechingOperator {
  id: string;
  name: string;
}

export interface PriceMaster {
  fourP: number;
  fourPTeching: number;
}

export interface FourPDepartmentSettings {
  caratThreshold: number;
  aboveThresholdDeptName: string;
  belowThresholdDeptName: string;
}

export interface FourPLot {
  id: string;
  kapan: string;
  lot: string;
  pcs: number; // Total PCS
  blocking: number;
  finalPcs: number;
  techingOperator: string;
  techingAmount: number;
  entryDate: string;
  isReturnedToFourP: boolean;
  carat?: number;
  department?: string;
  // Fields below are added on return
  fourPOperator?: string;
  returnDate?: string;
  fourPAmount?: number;
}


// Udhda Types
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
    returnTimeLimitMinutes: number; // Time in minutes
}

// Jiram Report Types
export interface JiramReportPacket {
    id: string;
    barcode: string;
    kapanNumber: string;
    scanTime: string;
}

// Box Sorting Types
export interface BoxSortingRange {
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
    boxLabel: string;
    scanTime: string;
}

// Settings
export interface ReturnScanSettings {
    sarin: boolean;
    laser: boolean;
}

export interface AutoBackupSettings {
    intervalHours: number; // 0 for disabled
    lastBackupTimestamp?: number;
    officeEndTime?: string; // e.g. "18:30"
    lastMasterBackupDate?: string; // e.g. "2023-10-27"
}

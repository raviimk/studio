export interface SarinPacket {
  id: string;
  senderName: string;
  operator: string;
  machine: string;
  kapanNumber: string;
  lotNumber: string;
  mainPacketNumber: string;
  packetCount: number;
  hasJiram: boolean;
  jiramCount?: number;
  date: string;
  time: string;
  isReturned: boolean;
  returnedBy?: string;
  returnDate?: string;
}

export interface ScannedPacket {
  id: string;
  kapanNumber: string;
  packetNumber: string;
  suffix: string;
  fullBarcode: string;
}

export interface LaserLot {
  id: string;
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
  packets: { mainPacketNumber: string; lotNumber: string; quantityTransferred: number }[];
}

    
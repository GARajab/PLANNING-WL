
export type WayleaveStatus = 'Pending TSS action' | 'Sent to M.O.W' | 'Received from M.O.W' | 'Sent to Area Engineer';

export interface WayleaveRecord {
  id: string;
  created_at: string;
  wayleaveNumber: string;
  status: WayleaveStatus;
  toEddDate: string | null;
  toMowDate: string | null;
  fromMowDate: string | null;
  toAreaEngineerDate: string | null;
  uspNumber: string;
  rccNumber: string;
  mspNumber: string;
  attachments: string[]; // Store filenames for mock
  remarks: string;
  last_updated_by?: string;
}

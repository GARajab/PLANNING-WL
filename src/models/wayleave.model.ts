export type WayleaveStatus = 'Pending with EDD' | 'Sent to M.O.W' | 'Received from M.O.W' | 'Sent to Area Engineer';

export interface WayleaveRecord {
  id: string;
  created_at: string;
  userId: string;
  wayleaveNumber: string;
  status: WayleaveStatus;
  toEddDate: string | null;
  toMowDate: string | null;
  fromMowDate: string | null;
  toAreaEngineerDate: string | null;
  uspNumber: string;
  rccNumber: string;
  mspNumber: string;
  attachments: string[]; // Stores public URLs of files in Supabase Storage
  remarks: string;
  lastUpdatedBy?: string;
}

import { Injectable, signal } from '@angular/core';
import { WayleaveRecord, WayleaveStatus } from '../models/wayleave.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

const LOCAL_STORAGE_KEY = 'wayleaveRecords';

@Injectable({ providedIn: 'root' })
export class DataService {
  records = signal<WayleaveRecord[]>([]);
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.loadRecords();
  }

  private loadRecords() {
    this.isLoading.set(true);
    setTimeout(() => {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      let records: WayleaveRecord[] = data ? JSON.parse(data) : [];
      if (records.length === 0) {
          records = this.getInitialMockData();
          this.saveRecords(records);
      }
      this.records.set(records);
      this.isLoading.set(false);
    }, 1000);
  }

  private saveRecords(records: WayleaveRecord[]) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    this.records.set(records);
  }

  getRecord(id: string): WayleaveRecord | undefined {
    return this.records().find(r => r.id === id);
  }

  addRecord(record: Omit<WayleaveRecord, 'id' | 'status' | 'lastUpdatedBy' | 'toEddDate'>): Promise<void> {
    this.isLoading.set(true);
    return new Promise(resolve => {
      setTimeout(() => {
        const currentUser = this.authService.currentUser();
        const newRecord: WayleaveRecord = {
          ...record,
          id: crypto.randomUUID(),
          status: 'Pending with EDD',
          toEddDate: new Date().toISOString(),
          lastUpdatedBy: currentUser?.name || 'System',
        };
        const updatedRecords = [newRecord, ...this.records()];
        this.saveRecords(updatedRecords);
        this.notificationService.addNotification(
          `New Wayleave ${record.wayleaveNumber} created by ${currentUser?.name}.`
        );
        this.notificationService.showToast('Record created successfully!', 'success');
        this.isLoading.set(false);
        resolve();
      }, 1500);
    });
  }

  updateRecord(updatedRecord: WayleaveRecord): Promise<void> {
    this.isLoading.set(true);
    return new Promise(resolve => {
      setTimeout(() => {
        const currentUser = this.authService.currentUser();
        const originalRecord = this.getRecord(updatedRecord.id);

        const recordWithUpdater = {
            ...updatedRecord,
            lastUpdatedBy: currentUser?.name || 'System'
        };

        const updatedRecords = this.records().map(r =>
          r.id === recordWithUpdater.id ? recordWithUpdater : r
        );
        this.saveRecords(updatedRecords);

        if (originalRecord?.status !== updatedRecord.status) {
            this.notificationService.addNotification(
                `Status of ${updatedRecord.wayleaveNumber} changed to "${updatedRecord.status}" by ${currentUser?.name}.`
            );
        }
        this.notificationService.showToast('Record updated successfully!', 'success');
        this.isLoading.set(false);
        resolve();
      }, 1500);
    });
  }
  
  deleteRecord(id: string): Promise<void> {
    this.isLoading.set(true);
    return new Promise(resolve => {
      setTimeout(() => {
        const updatedRecords = this.records().filter(r => r.id !== id);
        this.saveRecords(updatedRecords);
        this.notificationService.showToast('Record deleted successfully!', 'success');
        this.isLoading.set(false);
        resolve();
      }, 1000);
    });
  }


  private getInitialMockData(): WayleaveRecord[] {
    return [
      {
        id: '1',
        wayleaveNumber: 'WL-2024-001',
        status: 'Pending with EDD',
        toEddDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        toMowDate: null,
        fromMowDate: null,
        toAreaEngineerDate: null,
        uspNumber: 'USP-101',
        rccNumber: 'RCC-201',
        mspNumber: 'MSP-301',
        attachments: ['drawing-v1.pdf'],
        remarks: 'Initial submission for review.',
        lastUpdatedBy: 'EDD Planner'
      },
      {
        id: '2',
        wayleaveNumber: 'WL-2024-002',
        status: 'Sent to M.O.W',
        toEddDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        toMowDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fromMowDate: null,
        toAreaEngineerDate: null,
        uspNumber: 'USP-102',
        rccNumber: 'RCC-202',
        mspNumber: 'MSP-302',
        attachments: ['site-plan.pdf', 'approval-request.docx'],
        remarks: 'Forwarded to Ministry of Works for approval.',
        lastUpdatedBy: 'Consultant'
      },
       {
        id: '3',
        wayleaveNumber: 'WL-2024-003',
        status: 'Sent to Area Engineer',
        toEddDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        toMowDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        fromMowDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        toAreaEngineerDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        uspNumber: 'USP-103',
        rccNumber: 'RCC-203',
        mspNumber: 'MSP-303',
        attachments: ['final-docs.zip'],
        remarks: 'All approvals received. Sent for execution.',
        lastUpdatedBy: 'Consultant'
      },
    ];
  }
}

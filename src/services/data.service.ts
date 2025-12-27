
import { Injectable, signal, inject } from '@angular/core';
import { WayleaveRecord, WayleaveStatus } from '../models/wayleave.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  records = signal<WayleaveRecord[]>([]);
  isLoading = signal(false);

  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private supabase = inject(SupabaseService);

  constructor() {
    this.loadRecords();
  }

  async loadRecords() {
    if (!this.supabase.client) return;
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('wayleave_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.records.set(data || []);
    } catch (error: any) {
      this.notificationService.showToast(error.message || 'Failed to fetch records.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  getRecord(id: string): WayleaveRecord | undefined {
    return this.records().find(r => r.id === id);
  }

  async addRecord(record: Omit<WayleaveRecord, 'id' | 'created_at' | 'status' | 'lastUpdatedBy' | 'toEddDate'>): Promise<void> {
    if (!this.supabase.client) {
      this.notificationService.showToast('Application not configured.', 'error');
      return;
    }
    this.isLoading.set(true);
    const currentUser = this.authService.currentUser();

    const newRecordData = {
      ...record,
      status: 'Pending TSS action' as WayleaveStatus,
      toEddDate: new Date().toISOString(),
      lastUpdatedBy: currentUser ? `${currentUser.role} - ${currentUser.cpr}` : 'System',
    };

    try {
      const { data, error } = await this.supabase.client
        .from('wayleave_records')
        .insert(newRecordData)
        .select()
        .single();

      if (error) throw error;

      this.records.update(records => [data, ...records]);
      this.notificationService.addNotification(`New Wayleave ${record.wayleaveNumber} created by ${currentUser?.name}.`);
      this.notificationService.showToast('Record created successfully!', 'success');
    } catch (error: any) {
      this.notificationService.showToast(error.message || 'Failed to create record.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateRecord(updatedRecord: WayleaveRecord): Promise<void> {
    if (!this.supabase.client) {
      this.notificationService.showToast('Application not configured.', 'error');
      return;
    }
    this.isLoading.set(true);
    const currentUser = this.authService.currentUser();
    const originalRecord = this.getRecord(updatedRecord.id);

    const recordWithUpdater = {
      ...updatedRecord,
      lastUpdatedBy: currentUser ? `${currentUser.role} - ${currentUser.cpr}` : 'System'
    };

    // remove properties that should not be in the update payload
    const { id, created_at, ...updateData } = recordWithUpdater;

    try {
      const { data, error } = await this.supabase.client
        .from('wayleave_records')
        .update(updateData)
        .eq('id', updatedRecord.id)
        .select()
        .single();

      if (error) throw error;

      this.records.update(records => records.map(r => (r.id === data.id ? data : r)));

      if (originalRecord?.status !== updatedRecord.status) {
        this.notificationService.addNotification(
          `Status of ${updatedRecord.wayleaveNumber} changed to "${updatedRecord.status}" by ${currentUser?.name}.`
        );
      }
      this.notificationService.showToast('Record updated successfully!', 'success');
    } catch (error: any) {
      this.notificationService.showToast(error.message || 'Failed to update record.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteRecord(id: string): Promise<void> {
    if (!this.supabase.client) {
      this.notificationService.showToast('Application not configured.', 'error');
      return;
    }
    this.isLoading.set(true);
    try {
      const { error } = await this.supabase.client
        .from('wayleave_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.records.update(records => records.filter(r => r.id !== id));
      this.notificationService.showToast('Record deleted successfully!', 'success');
    } catch (error: any) {
      this.notificationService.showToast(error.message || 'Failed to delete record.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}

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
    // Removed loadRecords() from here to prevent race conditions on startup.
    // Data will now be loaded on-demand by the dashboard component.
  }

  async loadRecords() {
    if (!this.supabase.client) return;
    this.isLoading.set(true);
    try {
        // SELECT is fine. Supabase client auto-converts snake_case to camelCase on read.
        const { data, error } = await this.supabase.client
            .from('wayleave_records')
            .select('*')
            .order('created_at', { ascending: false });

        if(error) throw error;

        this.records.set(data || []);
    } catch(error: any) {
        this.notificationService.showToast(error.message || 'Failed to fetch records.', 'error');
    } finally {
        this.isLoading.set(false);
    }
  }

  getRecord(id: string): WayleaveRecord | undefined {
    return this.records().find(r => r.id === id);
  }

  async addRecord(record: Partial<WayleaveRecord>): Promise<WayleaveRecord | null> {
    if (!this.supabase.client) {
        this.notificationService.showToast('Application not configured.', 'error');
        return null;
    }
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
        this.notificationService.showToast('Authentication error. Please sign in again.', 'error');
        return null;
    }

    this.isLoading.set(true);
    
    // Map camelCase properties from the app model to snake_case for the database insert.
    const newRecordForDb = {
      id: record.id,
      wayleave_number: record.wayleaveNumber,
      usp_number: record.uspNumber,
      rcc_number: record.rccNumber,
      msp_number: record.mspNumber,
      remarks: record.remarks,
      attachments: record.attachments,
      user_id: currentUser.id,
      status: 'Pending with EDD' as WayleaveStatus,
      to_edd_date: new Date().toISOString(),
      to_mow_date: null,
      from_mow_date: null,
      to_area_engineer_date: null,
      last_updated_by: currentUser ? `${currentUser.role} - ${currentUser.cpr}` : 'System',
    };

    try {
        const { data, error } = await this.supabase.client
            .from('wayleave_records')
            .insert(newRecordForDb)
            .select()
            .single();

        if (error) throw error;
        
        // Supabase client returns camelCase keys, which matches our app model.
        this.records.update(records => [data, ...records]);
        this.notificationService.addNotification(`New Wayleave ${data.wayleaveNumber} created by ${currentUser?.name}.`);
        this.notificationService.showToast('Record created successfully!', 'success');
        return data;
    } catch (error: any) {
        this.notificationService.showToast(error.message || 'Failed to create record.', 'error');
        return null;
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

    // Map camelCase properties to snake_case for the database update.
    const updateDataForDb = {
        wayleave_number: updatedRecord.wayleaveNumber,
        status: updatedRecord.status,
        to_edd_date: updatedRecord.toEddDate,
        to_mow_date: updatedRecord.toMowDate,
        from_mow_date: updatedRecord.fromMowDate,
        to_area_engineer_date: updatedRecord.toAreaEngineerDate,
        usp_number: updatedRecord.uspNumber,
        rcc_number: updatedRecord.rccNumber,
        msp_number: updatedRecord.mspNumber,
        attachments: updatedRecord.attachments,
        remarks: updatedRecord.remarks,
        last_updated_by: currentUser ? `${currentUser.role} - ${currentUser.cpr}` : 'System'
    };
    
    try {
      const { data, error } = await this.supabase.client
        .from('wayleave_records')
        .update(updateDataForDb)
        .eq('id', updatedRecord.id)
        .select()
        .single();
      
      if(error) throw error;
      
      // Supabase client returns camelCase keys, which matches our app model.
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
    const recordToDelete = this.getRecord(id);
    if (!recordToDelete) {
        this.notificationService.showToast('Record not found.', 'error');
        return;
    }

    this.isLoading.set(true);
    try {
        // Step 1: Delete attachments from storage
        if (recordToDelete.attachments && recordToDelete.attachments.length > 0) {
            const filePaths = recordToDelete.attachments.map(url => {
                const urlObj = new URL(url);
                return urlObj.pathname.split('/attachments/')[1];
            });

            const { error: storageError } = await this.supabase.client.storage
                .from('attachments')
                .remove(filePaths);

            if (storageError) {
                // Log error but attempt to delete DB record anyway
                console.error('Could not delete all attachments:', storageError);
                this.notificationService.showToast('Could not delete attachments, but proceeding with record deletion.', 'info');
            }
        }

        // Step 2: Delete the record from the database
        const { error } = await this.supabase.client
            .from('wayleave_records')
            .delete()
            .eq('id', id);

        if(error) throw error;

        this.records.update(records => records.filter(r => r.id !== id));
        this.notificationService.showToast('Record and associated attachments deleted successfully!', 'success');
    } catch (error: any) {
        this.notificationService.showToast(error.message || 'Failed to delete record.', 'error');
    } finally {
        this.isLoading.set(false);
    }
  }
}
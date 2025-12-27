import { Component, ChangeDetectionStrategy, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WayleaveRecord, WayleaveStatus } from '../../models/wayleave.model';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { CloseIconComponent } from '../icons/close-icon.component';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-record-form',
  standalone: true,
  templateUrl: './record-form.component.html',
  imports: [CommonModule, FormsModule, CloseIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordFormComponent {
  record = input<WayleaveRecord | null>();
  close = output<void>();

  wayleaveRecord = signal<Partial<WayleaveRecord>>({});
  originalRecordState = signal<WayleaveRecord | null>(null);
  isEditMode = signal(false);
  isUploading = signal(false);
  
  statusOptions: WayleaveStatus[] = ['Pending with EDD', 'Sent to M.O.W', 'Received from M.O.W', 'Sent to Area Engineer'];

  dataService = inject(DataService);
  authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  constructor() {
    effect(() => {
        const rec = this.record();
        this.originalRecordState.set(rec);
        if(rec) {
            this.wayleaveRecord.set({...rec});
            this.isEditMode.set(true);
        } else {
            this.wayleaveRecord.set({
                id: crypto.randomUUID(), // Generate a unique ID for the new record upfront
                wayleaveNumber: '',
                uspNumber: '',
                rccNumber: '',
                mspNumber: '',
                remarks: '',
                attachments: []
            });
            this.isEditMode.set(false);
        }
    });
  }
  
  canEditField(fieldName: keyof WayleaveRecord): boolean {
    const user = this.authService.currentUser();
    if (!user || !user.role) return false;

    const userRoleLower = user.role.toLowerCase();

    // Admin can do everything
    if (userRoleLower === 'admin') return true;

    // EDD Planning can only create new records
    if (userRoleLower === 'edd planning') return !this.isEditMode();

    // Consultant can edit existing records, but not create new ones.
    if (userRoleLower === 'consultation team') {
      return this.isEditMode();
    }
    
    return false;
  }
  
  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.supabase.client) return;

    this.isUploading.set(true);
    const files = Array.from(input.files);
    // Use the pre-generated or existing record ID for a stable path
    const recordId = this.wayleaveRecord().id;

    if (!recordId) {
        this.notificationService.showToast('Cannot upload file: Record ID is missing.', 'error');
        this.isUploading.set(false);
        return;
    }

    try {
      for (const file of files) {
        const filePath = `${recordId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await this.supabase.client.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = this.supabase.client.storage
          .from('attachments')
          .getPublicUrl(filePath);

        if (data.publicUrl) {
          this.wayleaveRecord.update(rec => ({
            ...rec,
            attachments: [...(rec.attachments || []), data.publicUrl],
          }));
        }
      }
      this.notificationService.showToast(`${files.length} file(s) uploaded successfully. Please save the record to confirm changes.`, 'success');
    } catch (error: any) {
      this.notificationService.showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      this.isUploading.set(false);
      // Reset file input
      input.value = '';
    }
  }
  
  async removeAttachment(fileUrl: string) {
    if (!this.supabase.client) return;
    
    if (!confirm('Are you sure you want to remove this attachment? It will be deleted permanently.')) {
        return;
    }

    try {
        const url = new URL(fileUrl);
        // Extract path after the bucket name
        const filePath = url.pathname.split('/attachments/')[1];

        const { error } = await this.supabase.client.storage
            .from('attachments')
            .remove([filePath]);

        if (error) throw error;
        
        this.wayleaveRecord.update(rec => ({
            ...rec,
            attachments: rec.attachments?.filter(url => url !== fileUrl)
        }));
        this.notificationService.showToast('Attachment removed.', 'success');
    } catch (error: any) {
        this.notificationService.showToast(`Failed to remove attachment: ${error.message}`, 'error');
    }
  }

  async saveRecord() {
    const currentRecord = this.wayleaveRecord();
    
    // Automatically set dates based on status change
    const originalRecord = this.originalRecordState();
    if(this.isEditMode() && originalRecord && currentRecord.status && originalRecord.status !== currentRecord.status) {
        switch(currentRecord.status) {
            case 'Sent to M.O.W':
                if (!currentRecord.toMowDate) currentRecord.toMowDate = new Date().toISOString();
                break;
            case 'Received from M.O.W':
                if (!currentRecord.fromMowDate) currentRecord.fromMowDate = new Date().toISOString();
                break;
            case 'Sent to Area Engineer':
                if (!currentRecord.toAreaEngineerDate) currentRecord.toAreaEngineerDate = new Date().toISOString();
                break;
        }
    }

    if (this.isEditMode()) {
      await this.dataService.updateRecord(currentRecord as WayleaveRecord);
      this.close.emit();
    } else {
      const newRecord = await this.dataService.addRecord(currentRecord);
      if (newRecord) {
        // Instead of closing, transition to edit mode
        this.wayleaveRecord.set(newRecord);
        this.originalRecordState.set(newRecord); // Update original state for subsequent saves
        this.isEditMode.set(true);
        this.notificationService.showToast('Record created. You can now add attachments.', 'info');
      }
      // Do not close the form
    }
  }
  
  formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    } catch(e) {
        return '';
    }
  }
  
  updateDate(field: keyof WayleaveRecord, value: string) {
    this.wayleaveRecord.update(rec => {
        const newRec = {...rec};
        try {
            (newRec as any)[field] = new Date(value).toISOString();
        } catch(e) {
            (newRec as any)[field] = null;
        }
        return newRec;
    });
  }

  updateField(field: keyof WayleaveRecord, value: any) {
    this.wayleaveRecord.update(rec => ({ ...rec, [field]: value }));
  }
}
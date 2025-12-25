
import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WayleaveRecord, WayleaveStatus } from '../../models/wayleave.model';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { CloseIconComponent } from '../icons/close-icon.component';

@Component({
  selector: 'app-record-form',
  templateUrl: './record-form.component.html',
  imports: [FormsModule, CloseIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordFormComponent {
  record = input<WayleaveRecord | null>();
  close = output<void>();

  wayleaveRecord = signal<Partial<WayleaveRecord>>({});
  isEditMode = signal(false);
  
  statusOptions: WayleaveStatus[] = ['Pending with EDD', 'Sent to M.O.W', 'Received from M.O.W', 'Sent to Area Engineer'];

  constructor(public dataService: DataService, public authService: AuthService) {
    effect(() => {
        const rec = this.record();
        if(rec) {
            this.wayleaveRecord.set({...rec});
            this.isEditMode.set(true);
        } else {
            this.wayleaveRecord.set({
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
    if (!user) return false;

    // Admin can do everything
    if (user.role === 'Admin') return true;

    // EDD Planning can only create new records
    if (user.role === 'EDD Planning') return !this.isEditMode();

    // Consultant can edit existing records, but not create new ones.
    if (user.role === 'Consultation Team') {
      return this.isEditMode();
    }
    
    return false;
  }
  
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const fileNames = Array.from(input.files).map(f => f.name);
      this.wayleaveRecord.update(rec => ({ ...rec, attachments: [...(rec.attachments || []), ...fileNames] }));
    }
  }
  
  removeAttachment(fileName: string) {
    this.wayleaveRecord.update(rec => ({ ...rec, attachments: rec.attachments?.filter(f => f !== fileName) }));
  }

  async saveRecord() {
    const currentRecord = this.wayleaveRecord();
    
    // Automatically set dates based on status change
    const originalRecord = this.record();
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
    } else {
      await this.dataService.addRecord(currentRecord as any);
    }
    this.close.emit();
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
}

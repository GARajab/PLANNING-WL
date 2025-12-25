
import { Component, ChangeDetectionStrategy, signal, computed, effect, OnDestroy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { WayleaveRecord } from '../../models/wayleave.model';
import { AppNotification } from '../../models/notification.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { NotificationService } from '../../services/notification.service';
import { RecordFormComponent } from '../record-form/record-form.component';
import { BellIconComponent } from '../icons/bell-icon.component';
import { EditIconComponent } from '../icons/edit-icon.component';
import { TrashIconComponent } from '../icons/trash-icon.component';
import { WayleaveIconComponent } from '../icons/wayleave-icon.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RecordFormComponent, BellIconComponent, EditIconComponent, TrashIconComponent, WayleaveIconComponent]
})
export class DashboardComponent implements OnDestroy {
  authService = inject(AuthService);
  dataService = inject(DataService);
  notificationService = inject(NotificationService);

  isFormVisible = signal(false);
  selectedRecord = signal<WayleaveRecord | null>(null);
  
  showNotifications = signal(false);
  
  private timer: any;
  currentTime = signal(new Date());

  statusColors = {
    'Pending TSS action': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Sent to M.O.W': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Received from M.O.W': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Sent to Area Engineer': 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  constructor() {
    this.timer = setInterval(() => {
        this.currentTime.set(new Date());
    }, 60000); // Update every minute
  }

  ngOnDestroy(): void {
      clearInterval(this.timer);
  }

  openForm(record: WayleaveRecord | null) {
    this.selectedRecord.set(record);
    this.isFormVisible.set(true);
  }

  closeForm() {
    this.isFormVisible.set(false);
    this.selectedRecord.set(null);
  }
  
  canCreate(): boolean {
      return this.authService.hasRole(['Admin', 'EDD Planning']);
  }
  
  canEdit(record: WayleaveRecord): boolean {
    return this.authService.hasRole(['Admin', 'Consultation Team']);
  }
  
  canDelete(record: WayleaveRecord): boolean {
      return this.authService.hasRole(['Admin']);
  }

  confirmDelete(record: WayleaveRecord) {
      if(confirm(`Are you sure you want to delete Wayleave #${record.wayleaveNumber}?`)) {
          this.dataService.deleteRecord(record.id);
      }
  }

  calculateDuration(startDate: string | null): string {
    if (!startDate) return 'N/A';
    const start = new Date(startDate);
    const now = this.currentTime();
    const diff = now.getTime() - start.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  }
  
  formatDate(dateString: string | null): string {
    if(!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return 'Invalid Date'
    }
  }
  
  formatNotificationDate(date: Date): string {
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if(diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if(diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if(diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }
}

import { Component, ChangeDetectionStrategy, signal, OnDestroy, inject, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WayleaveRecord, WayleaveStatus } from '../../models/wayleave.model';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { NotificationService } from '../../services/notification.service';
import { AdminService } from '../../services/admin.service';
import { RecordFormComponent } from '../record-form/record-form.component';
import { AdminComponent } from '../admin/admin.component';
import { BellIconComponent } from '../icons/bell-icon.component';
import { EditIconComponent } from '../icons/edit-icon.component';
import { TrashIconComponent } from '../icons/trash-icon.component';
import { WayleaveIconComponent } from '../icons/wayleave-icon.component';
import { UserGroupIconComponent } from '../icons/user-group-icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RecordFormComponent, AdminComponent, BellIconComponent, EditIconComponent, TrashIconComponent, WayleaveIconComponent, UserGroupIconComponent]
})
export class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  dataService = inject(DataService);
  notificationService = inject(NotificationService);
  adminService = inject(AdminService);

  isFormVisible = signal(false);
  selectedRecord = signal<WayleaveRecord | null>(null);
  showNotifications = signal(false);
  isAdminPanelVisible = signal(false);
  
  searchTerm = signal('');
  statusFilter = signal<WayleaveStatus | 'All'>('All');
  statusOptions: WayleaveStatus[] = ['Pending with EDD', 'Sent to M.O.W', 'Received from M.O.W', 'Sent to Area Engineer'];
  
  private timer: any;
  currentTime = signal(new Date());

  statusColors = {
    'Pending with EDD': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Sent to M.O.W': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Received from M.O.W': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Sent to Area Engineer': 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  isAdmin = computed(() => this.authService.hasRole(['Admin']));

  isAwaitingRole = computed(() => {
    const user = this.authService.currentUser();
    return !!user && !user.role;
  });

  summaryCounts = computed(() => {
    const records = this.dataService.records();
    return {
        pending: records.filter(r => r.status === 'Pending with EDD').length,
        sentToMow: records.filter(r => r.status === 'Sent to M.O.W').length,
        receivedFromMow: records.filter(r => r.status === 'Received from M.O.W').length,
        sentToEngineer: records.filter(r => r.status === 'Sent to Area Engineer').length,
    };
  });

  filteredRecords = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    
    return this.dataService.records().filter(record => {
        const statusMatch = status === 'All' || record.status === status;

        const termMatch = !term ||
            record.wayleaveNumber.toLowerCase().includes(term) ||
            record.uspNumber.toLowerCase().includes(term) ||
            record.rccNumber.toLowerCase().includes(term) ||
            record.mspNumber.toLowerCase().includes(term);

        return statusMatch && termMatch;
    });
  });

  constructor() {
    this.timer = setInterval(() => {
        this.currentTime.set(new Date());
    }, 60000); // Update every minute
  }

  ngOnInit(): void {
    this.dataService.loadRecords(); // Load records when the dashboard becomes visible.
    if (this.isAdmin()) {
      // Pre-fetch users for the admin badge
      this.adminService.getUsers();
    }
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

  openAdminPanel() {
    this.isAdminPanelVisible.set(true);
  }
  
  closeAdminPanel() {
    this.isAdminPanelVisible.set(false);
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
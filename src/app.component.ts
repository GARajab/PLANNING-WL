import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from './services/auth.service';
import { environment } from './environments/environment';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigWarningComponent } from './components/config-warning/config-warning.component';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, LoginComponent, DashboardComponent, ConfigWarningComponent],
  template: `
    <ng-container *ngIf="isConfigured()">
      <app-login *ngIf="!authService.currentUser()"></app-login>
      <app-dashboard *ngIf="authService.currentUser()"></app-dashboard>

      <!-- Toast Container -->
      <div aria-live="assertive" class="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
        <div class="w-full flex flex-col items-center space-y-4 sm:items-end">
          <ng-container *ngFor="let toast of notificationService.toasts(); trackBy: toast.id">
            <div class="max-w-sm w-full bg-slate-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border"
                 [class]="getToastColor(toast.type)">
              <div class="p-4">
                <p class="text-sm font-medium text-white">{{ toast.message }}</p>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </ng-container>

    <app-config-warning *ngIf="!isConfigured()"></app-config-warning>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  isConfigured = signal(false);

  constructor() {
    if (environment.supabaseUrl && environment.supabaseUrl !== 'YOUR_SUPABASE_URL' &&
      environment.supabaseKey && environment.supabaseKey !== 'YOUR_SUPABASE_ANON_KEY') {
      this.isConfigured.set(true);
    }
  }

  getToastColor(type: 'success' | 'error' | 'info') {
    switch (type) {
      case 'success': return 'bg-green-600 border-green-700';
      case 'error': return 'bg-red-600 border-red-700';
      default: return 'bg-blue-600 border-blue-700';
    }
  }
}

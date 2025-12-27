import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { environment } from './environments/environment';
import { ConfigWarningComponent } from './components/config-warning/config-warning.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoginComponent, DashboardComponent, ConfigWarningComponent]
})
export class AppComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  isConfigured = signal(false);

  constructor() {
    if (environment.supabaseUrl && environment.supabaseUrl !== 'YOUR_SUPABASE_URL' && environment.supabaseKey && environment.supabaseKey !== 'YOUR_SUPABASE_ANON_KEY') {
        this.isConfigured.set(true);
    }
  }

  getToastColor(type: 'success' | 'error' | 'info') {
    switch(type) {
      case 'success': return 'bg-green-600 border-green-700';
      case 'error': return 'bg-red-600 border-red-700';
      default: return 'bg-blue-600 border-blue-700';
    }
  }
}

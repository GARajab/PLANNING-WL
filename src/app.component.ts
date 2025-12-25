
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, LoginComponent, DashboardComponent]
})
export class AppComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  getToastColor(type: 'success' | 'error' | 'info') {
    switch(type) {
      case 'success': return 'bg-green-600 border-green-700';
      case 'error': return 'bg-red-600 border-red-700';
      default: return 'bg-blue-600 border-blue-700';
    }
  }
}

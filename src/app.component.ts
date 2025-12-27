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
    <!-- ALWAYS SHOW LOGIN for testing -->
    <app-login *ngIf="!authService.currentUser()"></app-login>
    <app-dashboard *ngIf="authService.currentUser()"></app-dashboard>
  `,
})
export class AppComponent {
  authService = inject(AuthService);
}

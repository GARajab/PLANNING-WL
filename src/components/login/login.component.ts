import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { WayleaveIconComponent } from '../icons/wayleave-icon.component';
import { UserIconComponent } from '../icons/user-icon.component';
import { LockIconComponent } from '../icons/lock-icon.component';

@Component({
  selector: 'app-login',
  standalone: true, // ✅ THIS WAS MISSING
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    WayleaveIconComponent,
    UserIconComponent,
    LockIconComponent
  ]
})
export class LoginComponent {
  cpr = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService) { }

  async onLogin() {
    if (!this.cpr() || !this.password()) {
      this.errorMessage.set('CPR and password are required.');
      return;
    }

    if (!/^\d{9}$/.test(this.cpr())) {
      this.errorMessage.set('CPR must be a 9-digit number.');
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);

    const { success, error } = await this.authService.login(
      this.cpr(),
      this.password()
    );

    if (!success) {
      this.errorMessage.set(error || 'Invalid credentials. Please try again.');
    }

    this.isLoading.set(false);
  }
}

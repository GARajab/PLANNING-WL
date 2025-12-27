import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { WayleaveIconComponent } from '../icons/wayleave-icon.component';
import { UserIconComponent } from '../icons/user-icon.component';
import { LockIconComponent } from '../icons/lock-icon.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [FormsModule, WayleaveIconComponent, UserIconComponent, LockIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  cpr = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) { }

  async onLogin(form: NgForm) {
    if (!form.valid) {
      this.errorMessage.set('CPR and Password are required.');
      return;
    }

    if (!/^\d{9}$/.test(this.cpr())) {
      this.errorMessage.set('CPR must be a 9-digit number.');
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      const { success, error } = await this.authService.login(this.cpr(), this.password());
      if (!success) {
        this.errorMessage.set(error || 'Invalid credentials.');
      } else {
        // Navigate to dashboard on success
        this.router.navigate(['/dashboard']);
      }
    } catch (err) {
      console.error('Login error:', err);
      this.errorMessage.set('Login failed. See console for details.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

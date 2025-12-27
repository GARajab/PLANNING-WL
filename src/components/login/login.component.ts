import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  cpr = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService) { }

  async onLogin() {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const cprValue = this.cpr();
    const passwordValue = this.password();

    if (!cprValue || !passwordValue) {
      this.errorMessage.set('CPR and password are required.');
      this.isLoading.set(false);
      return;
    }

    const { success, error } = await this.authService.login(cprValue, passwordValue);

    if (!success) {
      this.errorMessage.set(error || 'Login failed. Please try again.');
    }

    this.isLoading.set(false);
  }
}

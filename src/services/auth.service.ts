
import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';

// --- MOCK USER DATABASE ---
const MOCK_USERS: User[] = [
  { cpr: '123456789', name: 'Admin User', password: 'admin', role: 'Admin' },
  { cpr: '987654321', name: 'EDD Planner', password: 'edd', role: 'EDD Planning' },
  { cpr: '112233445', name: 'Consultant', password: 'consult', role: 'Consultation Team' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor(private notificationService: NotificationService) {
    // Check for logged in user in session storage
    const userJson = sessionStorage.getItem('currentUser');
    if (userJson) {
      this.currentUser.set(JSON.parse(userJson));
    }
  }

  login(cpr: string, password: string): Promise<boolean> {
    return new Promise(resolve => {
        setTimeout(() => { // Simulate API call
            const user = MOCK_USERS.find(u => u.cpr === cpr && u.password === password);
            if (user) {
                const userToStore = { ...user };
                delete userToStore.password; // Don't store password
                this.currentUser.set(userToStore);
                sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
                this.notificationService.showToast(`Welcome back, ${user.name}!`, 'success');
                resolve(true);
            } else {
                this.notificationService.showToast('Invalid CPR or password.', 'error');
                resolve(false);
            }
        }, 1000);
    });
  }

  logout() {
    this.currentUser.set(null);
    sessionStorage.removeItem('currentUser');
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }
}

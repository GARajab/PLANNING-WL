import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Simulate a logged-in Admin user so the dashboard is immediately accessible.
  // This removes the need for a login screen.
  currentUser = signal<User | null>({
    id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for a virtual user
    cpr: '000000000',
    name: 'Default Admin',
    role: 'Admin',
  });

  /**
   * Checks if the simulated user has one of the specified roles.
   * @param roles - An array of roles to check against.
   * @returns True if the user has a matching role, false otherwise.
   */
  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUser();
    if (!user || !user.role) {
      return false;
    }
    const userRoleLower = user.role.toLowerCase();
    return roles.some(r => r.toLowerCase() === userRoleLower);
  }

  // Login and logout methods are no longer needed as there's no authentication flow.
  // The constructor logic for onAuthStateChange has also been removed.
  async logout() {
    console.log('Logout is disabled in this version of the application.');
  }
}


import { Injectable, signal, inject } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  private supabase = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  constructor() {
    if (!this.supabase.client) return;

    this.supabase.client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch profile and set current user
        const { data: profile, error } = await this.supabase.client!
            .from('profiles')
            .select(`*`)
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            this.notificationService.showToast('Could not fetch user profile.', 'error');
            this.currentUser.set(null);
        } else {
            this.currentUser.set({
                id: session.user.id,
                cpr: profile.cpr,
                name: profile.name,
                role: profile.role,
            });
        }
      } else {
        this.currentUser.set(null);
      }
    });
  }

  async login(cpr: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase.client) {
        return { success: false, error: 'Application is not configured.' };
    }
    // Supabase requires an email format, so we append a dummy domain.
    const email = `${cpr}@wayleave.app`;

    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      this.notificationService.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { data: profile, error: profileError } = await this.supabase.client
        .from('profiles')
        .select(`*`)
        .eq('id', data.user.id)
        .single();
        
      if(profile) {
        this.notificationService.showToast(`Welcome back, ${profile.name}!`, 'success');
        this.currentUser.set({
            id: data.user.id,
            cpr: profile.cpr,
            name: profile.name,
            role: profile.role,
        });
        return { success: true };
      } else {
        this.notificationService.showToast('User profile not found.', 'error');
        await this.logout();
        return { success: false, error: 'User profile not found.' };
      }
    }
    return { success: false, error: 'An unknown error occurred.' };
  }

  async logout() {
    if (!this.supabase.client) return;
    const { error } = await this.supabase.client.auth.signOut();
    if (error) {
        this.notificationService.showToast('Error signing out.', 'error');
    }
    this.currentUser.set(null);
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }
}

import { Injectable, signal, inject, computed } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  users = signal<User[]>([]);
  isLoading = signal(false);

  pendingUsersCount = computed(() => this.users().filter(user => !user.role).length);

  private supabase = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  async getUsers() {
    if (!this.supabase.client) return;
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      this.users.set(data || []);
    } catch (error: any) {
      this.notificationService.showToast(error.message || 'Failed to fetch users.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateUserRole(userId: string, role: UserRole | null) {
    if (!this.supabase.client) return;
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      this.users.update(users => users.map(u => u.id === userId ? data : u));
      this.notificationService.showToast('User role updated successfully!', 'success');
    } catch (error: any) {
      this.notificationService.showToast(error.message || 'Failed to update user role.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
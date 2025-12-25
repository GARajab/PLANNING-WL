
import { Injectable, signal, computed } from '@angular/core';
import { AppNotification, Toast } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications = signal<AppNotification[]>([]);
  toasts = signal<Toast[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  constructor() {
     // Load notifications from local storage
    const storedNotifications = localStorage.getItem('appNotifications');
    if (storedNotifications) {
      this.notifications.set(JSON.parse(storedNotifications).map((n: any) => ({...n, timestamp: new Date(n.timestamp)})));
    }
  }

  addNotification(message: string) {
    this.notifications.update(current => {
      const newNotifications = [
        { id: Date.now(), message, timestamp: new Date(), read: false },
        ...current,
      ];
      localStorage.setItem('appNotifications', JSON.stringify(newNotifications));
      return newNotifications;
    });
  }

  markAllAsRead() {
    this.notifications.update(current => {
      const updated = current.map(n => ({ ...n, read: true }));
      localStorage.setItem('appNotifications', JSON.stringify(updated));
      return updated;
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const newToast = { id: Date.now(), message, type };
    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== newToast.id));
    }, 5000);
  }
}


export interface AppNotification {
  id: number;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

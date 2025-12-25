
export type UserRole = 'Admin' | 'EDD Planning' | 'Consultation Team';

export interface User {
  id: string;
  cpr: string;
  name: string;
  password?: string; // Should not be stored long-term in a real app
  role: UserRole;
}

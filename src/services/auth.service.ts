
import { Injectable, signal, inject } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';
import type { User as SupabaseUser } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  private supabase = inject(SupabaseService);
  private notificationService = inject(NotificationService);
  private isLoggingIn = false; // Flag to prevent race conditions

  constructor() {
    if (!this.supabase.client) return;

    this.supabase.client.auth.onAuthStateChange(async (event, session) => {
      // Guard against running during an active, manual login flow.
      if (this.isLoggingIn) {
        return;
      }
      
      // This listener now ONLY handles session restoration and SIGNED_OUT events.
      // The active login flow is handled by the login() method itself.
      if (event === 'SIGNED_OUT') {
        // Clear user on sign out
        if (this.currentUser() !== null) {
          this.currentUser.set(null);
        }
        return;
      }
      
      // On initial app load, if a session exists, try to load the corresponding profile.
      if (session?.user && !this.currentUser()) {
        await this.loadUserProfile(session.user, event);
      } else if (!session?.user && this.currentUser()) {
        // Handles cases where session expires or becomes invalid in the background
        this.currentUser.set(null);
      }
    });
  }

  /**
   * Loads a user profile from the database based on a Supabase user object.
   * If the profile doesn't exist or fails to load, it sets a temporary,
   * role-less user to prevent login loops.
  */
  private async loadUserProfile(user: SupabaseUser, event?: string): Promise<boolean> {
      const { data: profile, error } = await this.supabase.client
          .from('profiles')
          .select(`*`)
          .eq('id', user.id)
          .maybeSingle();

      if (error) {
          // This block now specifically handles the "more than one row" error
          console.error('Failed to load user profile:', error?.message);
          this.notificationService.showToast(`Error loading profile: ${error.message}`, 'error');
          const cprFromEmail = user.email?.split('@')[0] || null;
          this.currentUser.set({
            id: user.id, cpr: cprFromEmail, name: 'Error State User', role: null,
          });
          return true; // Still logged in, but in a degraded state
      }

      if (profile) {
          // Successfully found a profile
          const userName = profile.name || (profile.cpr ? `User ${profile.cpr}` : 'User');
          this.currentUser.set({
              id: user.id, cpr: profile.cpr, name: userName, role: profile.role,
          });
          if (event === 'SIGNED_IN') {
             this.notificationService.showToast(`Welcome back, ${userName}!`, 'success');
          }
          return true;
      }
      
      // This case handles a user who is authenticated but their profile does not exist yet.
      // This is expected for new users who haven't been assigned a role by an admin.
      console.log('User profile not yet created for:', user.id);
      const cprFromEmail = user.email?.split('@')[0] || null;
      const fallbackName = cprFromEmail ? `User ${cprFromEmail}` : 'New User';
      this.currentUser.set({
        id: user.id, cpr: cprFromEmail, name: fallbackName, role: null,
      });
      // The dashboard banner will explain the view-only status, no toast needed here.
      return true;
  }

  async login(cpr: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase.client) {
        return { success: false, error: 'Application is not configured.' };
    }
    
    this.isLoggingIn = true;
    try {
        const email = `${cpr}@wayleave.app`;

        // 1. Attempt to sign in
        const { data: signInData, error: signInError } = await this.supabase.client.auth.signInWithPassword({ email, password });

        // Case 1: Successful login
        if (signInData.user) {
            return { success: await this.loadUserProfile(signInData.user, 'SIGNED_IN') };
        }

        // Case 2: Sign-in failed with a specific error message
        if (signInError) {
            // Subcase 2.1: User does not exist (or password is wrong), so try to sign them up.
            // A more robust check for "invalid credentials" error.
            if (signInError.message.toLowerCase().includes('invalid login credentials')) {
                this.notificationService.showToast('Account not found. Attempting to create a new one...', 'info');

                // Attempt to sign up the new user.
                const { data: signUpData, error: signUpError } = await this.supabase.client.auth.signUp({ email, password });

                if (signUpError) {
                    // If sign-up fails because the user already exists, it means the password was wrong on the initial attempt.
                    if (signUpError.message.includes('User already registered')) {
                        return { success: false, error: 'Invalid CPR or password.' };
                    }
                    // Otherwise, it's a different sign-up error (e.g., weak password).
                    return { success: false, error: signUpError.message };
                }

                if (signUpData.user) {
                     // Check if a session was created. If not, email verification is likely required.
                     if (!signUpData.session) {
                        const errorMessage = "Account created, but email verification is required. To use CPR-based sign-up, the administrator must disable 'Confirm email' in the Supabase project's Authentication settings.";
                        this.notificationService.showToast("Account created, but requires email verification.", 'info');
                        return { success: false, error: errorMessage };
                     }

                     // Sign-up was successful, now create the user's profile.
                     const { data, error: rpcError } = await this.supabase.client.rpc('create_user_profile').single();
                     
                     if (rpcError) {
                         await this.logout(); // Clean up failed sign-up attempt.
                         const message = `Account created, but profile setup failed: ${rpcError.message}`;
                         this.notificationService.showToast(message, 'error');
                         return { success: false, error: message };
                     }
                     
                     // Cast the returned profile data to our known User type.
                     const newProfile = data as User;

                     // Successfully created profile, set current user signal to complete login.
                     const userName = newProfile.name || (newProfile.cpr ? `User ${newProfile.cpr}` : 'User');
                     this.currentUser.set({
                         id: signUpData.user.id, cpr: newProfile.cpr, name: userName, role: newProfile.role,
                     });
                     this.notificationService.showToast(`Welcome, ${userName}! Your account has been activated.`, 'success');
                     return { success: true };
                }
                
                return { success: false, error: 'Could not create account. Please try again.' };
            }
            
            // Subcase 2.2: For any other sign-in error, display it.
            return { success: false, error: signInError.message };
        }
        
        // Case 3: No user and no error from signIn - this implies email confirmation is pending for an existing account.
        if (!signInData.user && !signInError) {
            const message = 'Please check your email to confirm your account before you can sign in.';
            this.notificationService.showToast(message, 'info');
            return { success: false, error: message };
        }

        // Fallback for any unhandled cases.
        return { success: false, error: 'An unknown authentication error occurred. Please try again.' };
    } finally {
        this.isLoggingIn = false;
    }
  }

  async logout() {
    if (!this.supabase.client) return;
    const { error } = await this.supabase.client.auth.signOut();
    if (error) {
        this.notificationService.showToast('Error signing out.', 'error');
    }
    // The onAuthStateChange listener will set currentUser to null.
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUser();
    if (!user || !user.role) {
      return false;
    }
    const userRoleLower = user.role.toLowerCase();
    return roles.some(r => r.toLowerCase() === userRoleLower);
  }
}

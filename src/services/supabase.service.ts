
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public readonly client: SupabaseClient | null;

  constructor() {
    const isConfigured = environment.supabaseUrl && environment.supabaseUrl !== 'YOUR_SUPABASE_URL' && environment.supabaseKey && environment.supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';
    
    if (isConfigured) {
        this.client = createClient(environment.supabaseUrl, environment.supabaseKey);
    } else {
        this.client = null;
    }
  }
}

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-config-warning',
  template: `
    <div class="flex items-center justify-center min-h-screen p-4 bg-slate-900">
      <div class="w-full max-w-2xl p-8 space-y-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-yellow-600">
        <div class="text-center space-y-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-yellow-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 class="text-3xl font-bold text-yellow-400">Configuration Required</h1>
          <p class="text-slate-300 text-lg">Your Supabase credentials are not set up yet.</p>
        </div>
        <div class="text-slate-400 space-y-4 text-base">
          <p>To run this application, you need to provide your Supabase project URL and public anon key.</p>
          <p>Please open the following file in the editor:</p>
          <div class="bg-slate-900 p-3 rounded-md text-slate-200 font-mono text-sm border border-slate-700">
            src/environments/environment.ts
          </div>
          <p>And replace the placeholder values with your actual credentials:</p>
          <pre class="bg-slate-900 p-4 rounded-md text-slate-200 font-mono text-sm overflow-x-auto border border-slate-700"><code><span class="text-slate-500">// src/environments/environment.ts</span>
export const environment = {{ '{' }}
  production: false,
  supabaseUrl: <span class="text-yellow-400">'YOUR_SUPABASE_URL'</span>,
  supabaseKey: <span class="text-yellow-400">'YOUR_SUPABASE_ANON_KEY'</span>,
{{ '}' }};</code></pre>
          <p>You can find these keys in your Supabase project dashboard under <span class="font-semibold text-slate-200">Project Settings > API</span>.</p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigWarningComponent {}

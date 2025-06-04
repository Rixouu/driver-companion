import { createBrowserClient } from '@supabase/ssr';
// Assuming your generated Database type is in @/types/supabase.ts
// If not, you might need to adjust this path or generate types: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
import type { Database } from '@/types/supabase';

// Infer the client type from the factory function
type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClientInstance: BrowserSupabaseClient | null = null;

/**
 * Retrieves the singleton instance of the Supabase browser client.
 * Initializes the client on first call.
 * 
 * Important: This client is intended for client-side (browser) use only.
 * It uses NEXT_PUBLIC_ environment variables and is safe to expose to the browser.
 */
export function getSupabaseBrowserClient(): BrowserSupabaseClient {
  if (!browserClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined. Please check your environment variables.');
    }
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Please check your environment variables.');
    }

    browserClientInstance = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    );
  }
  return browserClientInstance;
}

/**
 * Custom hook to easily access the Supabase browser client instance within React components.
 * Ensures that the client is only initialized once.
 */
export function useSupabaseBrowser(): BrowserSupabaseClient {
  // While getSupabaseBrowserClient ensures singleton, calling it directly in a hook
  // is a common pattern and reinforces its usage context.
  return getSupabaseBrowserClient();
} 
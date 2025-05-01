import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Singleton implementation for the Supabase client to ensure we only create one instance
// that's used consistently throughout the application
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Define a unique key for the client to ensure we're using the same storage key
const STORAGE_KEY = 'vehicle-inspection-auth'

// Get environment variables - ensure they are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log environment variable state on client initialization
if (typeof window !== 'undefined') {
  if (!supabaseUrl) {
    console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseAnonKey) {
    console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}

// Helper to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export const getSupabaseClient = () => {
  // In server components, we need to create a new instance each time
  if (typeof window === 'undefined') {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[getSupabaseClient - Server Context] Missing Supabase env vars!");
      
      // Return a client with default values, which will attempt to use automatic env detection
      // This might still work if the environment has variables set but our process doesn't see them
      return createClientComponentClient<Database>();
    }
    
    // Validate URL to avoid URL constructor errors
    if (!isValidUrl(supabaseUrl)) {
      console.error(`[getSupabaseClient - Server Context] Invalid Supabase URL: ${supabaseUrl}`);
      return createClientComponentClient<Database>();
    }
    
    // Return a properly configured client
    return createClientComponentClient<Database>({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    });
  }
  
  // For client components, reuse the same instance
  if (!clientInstance) {
    console.log("[getSupabaseClient - Client Context] Creating new client instance.");
    
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[getSupabaseClient - Client Context] Missing Supabase env vars! Cannot create client.");
        // Create with default options, letting the SDK try to auto-detect values
        clientInstance = createClientComponentClient<Database>({
          cookieOptions: {
            name: STORAGE_KEY
          }
        });
      } else {
        // Create with explicit configuration
        clientInstance = createClientComponentClient<Database>({
          supabaseUrl,
          supabaseKey: supabaseAnonKey,
          cookieOptions: {
            name: STORAGE_KEY,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          }
        });
      }
    } catch (error) {
      console.error("[getSupabaseClient] Error creating client:", error);
      // Last resort fallback
      clientInstance = createClientComponentClient<Database>();
    }
  }
  
  return clientInstance;
}

// Export a singleton instance for direct imports
export const supabase = getSupabaseClient()

// Helper function to clear auth state in case of persistent issues
export const clearAuthState = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    const client = getSupabaseClient();
    await client.auth.signOut({ scope: 'local' });
    
    // Clear cookies and storage
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    
    localStorage.clear();
    sessionStorage.clear();
    
    console.log("[Supabase] Auth state cleared");
  } catch (error) {
    console.error("[Supabase] Error clearing auth state:", error);
  }
} 
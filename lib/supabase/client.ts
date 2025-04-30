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

if (!supabaseUrl) {
  console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  // throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"); // Optional: Throw error during build/dev
}
if (!supabaseAnonKey) {
  console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  // throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"); // Optional: Throw error
}

export const getSupabaseClient = () => {
  // In server components, we need to create a new instance each time (should ideally use server helpers, but this ensures config)
  if (typeof window === 'undefined') {
    // NOTE: Using createClientComponentClient on the server is NOT recommended.
    // You should use createServerComponentClient or createRouteHandlerClient.
    // However, for debugging config, we ensure vars are passed here too.
    if (!supabaseUrl || !supabaseAnonKey) {
         console.error("[getSupabaseClient - Server Context] Missing Supabase env vars!");
         // Return a dummy or throw? For now, log and continue
         return createClientComponentClient<Database>(); // Will likely fail later
    }
    return createClientComponentClient<Database>(
        { supabaseUrl, supabaseKey: supabaseAnonKey } // Explicitly pass config
    );
  }
  
  // For client components, reuse the same instance
  if (!clientInstance) {
    console.log("[getSupabaseClient - Client Context] Creating new client instance.");
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[getSupabaseClient - Client Context] Missing Supabase env vars! Cannot create client.");
      // Handle this case - maybe return null or throw? For now, log.
      // Returning a default client will likely cause errors later.
      // Consider a state management solution to handle this configuration error.
       return createClientComponentClient<Database>(); // Fallback, will likely fail later
    }
    clientInstance = createClientComponentClient<Database>({
      supabaseUrl: supabaseUrl,         // Explicitly pass URL
      supabaseKey: supabaseAnonKey,     // Explicitly pass Key
      cookieOptions: {
        name: STORAGE_KEY
      }
    })
  }
  
  return clientInstance
}

// Export a singleton instance for direct imports (will now use explicit config)
export const supabase = getSupabaseClient() 
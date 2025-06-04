// lib/supabase/server.ts
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase'; // Ensure this path is correct
import { createServerClient as createActualServerClient } from '@/lib/supabase/index'; // Import the new centralized server client

// Removed local supabaseUrl and supabaseAnonKey as they are handled by the centralized client

// Removed local createServerSupabaseClient function as it's replaced by the import

// Renamed function to avoid confusion and to better describe its purpose
export async function getSupabaseServerClient() {
  const cookieStore = await cookies(); // Await the cookies() call
  // Pass the cookie store to the actual client creator from lib/supabase/index.ts
  return createActualServerClient(cookieStore); 
}

export async function getCurrentUser() {
  // Use the renamed helper to get the client
  const supabase = await getSupabaseServerClient(); 
  try {
    // .auth.getUser() is the recommended way to get the current user securely on the server.
    // It validates the session against the Supabase Auth server.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Log the error but don't throw, allow calling code to handle user: null
      console.error('[SupabaseServerClient] Error getting user in getCurrentUser:', error.message);
      return { user: null, error };
    }
    return { user, error: null };
  } catch (error: any) {
    // Catch any unexpected exceptions during the process
    console.error('[SupabaseServerClient] Exception in getCurrentUser:', error.message);
    const typedError = error instanceof Error ? error : new Error(String(error));
    return { user: null, error: typedError };
  }
}

// Removed deprecated getSupabaseServerClient function 
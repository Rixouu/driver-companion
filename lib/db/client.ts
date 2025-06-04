import { createClient } from '@/lib/supabase/index';

// This function now directly calls the actual createClient from the new central location.
export function getSupabaseClient() {
  return createClient();
}

// Remove the re-export of the no-longer-existing 'supabase' instance.
// export const supabase = supabaseClient; // supabaseClient is no longer imported as 'supabase' from client.ts 
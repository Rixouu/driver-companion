// Barrel file for supabase clients and utilities
// This exports the supabase client and other utilities

export { createClient, createServerClient } from './supabase/index';
export { updateSession } from './supabase/middleware';
export { createServiceClient } from './supabase/service-client';

// Removed exports for getSupabaseClient, clearAuthState, and initStorage
// The Database and Json types are typically imported directly from @/types/supabase or @/types respectively, not re-exported here.

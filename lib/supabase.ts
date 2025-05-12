// Barrel file for supabase clients and utilities
// This exports the supabase client and other utilities

export { supabase, getSupabaseClient, clearAuthState } from './supabase/client'
export { createServiceClient } from './supabase/service-client'
export { initStorage } from './supabase/index'

// The Database and Json types are already defined below - no need to re-export

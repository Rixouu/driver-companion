import type { Database } from './supabase';

// Centralized Customer type based on Supabase customers table
export type Customer = Database['public']['Tables']['customers']['Row'];

// Types for Insert/Update if forms handle customers directly:
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']; 
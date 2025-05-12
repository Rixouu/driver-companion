// This file contains the database type definitions generated from Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // Database schema definitions will be moved here from lib/supabase.ts
      // For now this is a placeholder - types are used from types/supabase.ts
    }
    Views: {
      // Database view definitions
    }
    Functions: {
      // Database function definitions
    }
    Enums: {
      // Database enum definitions
    }
    CompositeTypes: {
      // Database composite type definitions
    }
  }
} 
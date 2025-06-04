'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js'; // For the client type

// Infer the specific client type if needed, or use SupabaseClient<Database>
type BrowserSupabaseClient = SupabaseClient<Database>; 
// Or: ReturnType<typeof getSupabaseBrowserClient>;

const SupabaseContext = createContext<BrowserSupabaseClient | undefined>(undefined);

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase(): BrowserSupabaseClient {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 
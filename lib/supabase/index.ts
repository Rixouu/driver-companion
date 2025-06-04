// This file is the central export for Supabase client functions.

// Re-export service client - This should be the first export if it's standalone from the client/server client logic below
export { createServiceClient } from './service-client';

import { createBrowserClient, createServerClient as _createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// Ensure environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Missing Supabase URL. Ensure NEXT_PUBLIC_SUPABASE_URL is set.");
}
if (!supabaseAnonKey) {
  console.error("Missing Supabase Anon Key. Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set.");
}

/**
 * Creates a Supabase client for use in Client Components.
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing. Cannot initialize Supabase client.");
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Creates a Supabase client for use in Server Components, Route Handlers, and Server Actions.
 * @param cookieStore A Next.js ReadonlyRequestCookies store.
 */
export function createServerClient(cookieStore: ReadonlyRequestCookies) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing. Cannot initialize Supabase server client.");
  }
  return _createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            console.error(`Failed to set cookie: ${name}`, error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', options);
          } catch (error) {
            console.error(`Failed to remove cookie: ${name}`, error);
          }
        },
      },
    }
  );
}

// Initialize the bucket - use the new createClient function
export async function initStorage() {
  const supabase = createClient();
  
  const { data: bucket } = await supabase.storage.getBucket('vehicles');
  
  if (!bucket) {
    await supabase.storage.createBucket('vehicles', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
  }
} 
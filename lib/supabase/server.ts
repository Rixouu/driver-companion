// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Adjusted path

// This function is async to match the pattern required by Next.js 15
export async function createServerSupabaseClient() {
  // Using cookies in an async context is required in Next.js 15
  const cookieStore = cookies();
  // Pass the cookie store correctly to the client
  return createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  });
} 
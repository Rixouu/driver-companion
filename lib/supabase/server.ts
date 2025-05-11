// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Adjusted path
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

// This function is async to match the pattern required by Next.js
export async function createServerSupabaseClient() {
  try {
    console.log('Creating server Supabase client');
    
    // Create the Supabase client with the correct pattern for Next.js 15
    // In Next.js 15, cookies() should not be called directly but passed as a function
    // to avoid the "cookies() should be awaited" error
    const client = createServerComponentClient<Database>({ 
      cookies // Pass the cookies function directly
    });
    
    // Test the client connection with a simple query
    try {
      const { data: { session } } = await client.auth.getSession();
      console.log('Session check result:', session ? 'Active session found' : 'No active session');
    } catch (sessionError) {
      console.error('Error checking session:', sessionError);
    }
    
    console.log('Server Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Error creating server Supabase client:', error);
    throw error;
  }
}

// Function to get the current user without using auth.getUser()
// This avoids the cookie issue in Next.js 15 by using the client that's already been created
export async function getCurrentUser(supabase: any) {
  try {
    // Since supabase client is already created and passed in with proper cookie handling,
    // we just need to use it correctly without re-accessing cookies
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { user: null };
    }
    
    return { user: session.user };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return { user: null };
  }
}

// Deprecated - use createServerSupabaseClient instead
export async function getSupabaseServerClient() {
  return createServerComponentClient<Database>({ cookies });
} 
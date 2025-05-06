// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Adjusted path

// This function is async to match the pattern required by Next.js
export async function createServerSupabaseClient() {
  try {
    console.log('Creating server Supabase client');
    
    // Get cookie store - this is the correct way to handle cookies in Next.js
    const cookieStore = cookies();
    console.log('Cookie store initialized');
    
    // Create the Supabase client with the correct cookie store
    const client = createServerComponentClient<Database>({ 
      cookies: () => cookieStore 
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
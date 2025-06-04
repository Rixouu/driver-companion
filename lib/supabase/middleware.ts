import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import type { User, SupabaseClient } from '@supabase/supabase-js';

interface UpdateSessionResult {
  response: NextResponse;
  supabase: SupabaseClient<Database>;
  user: User | null;
}

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing for middleware.");
    // In this case, we can't create a Supabase client, so we return a dummy one / null for user
    // and the original response. This needs careful handling by the caller.
    // Or, we could throw an error if Supabase is critical for all middleware paths.
    return {
      response: supabaseResponse,
      supabase: {} as SupabaseClient<Database>, // Placeholder, ideally handled better
      user: null,
    };
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          // Re-create response to ensure it has the latest request headers/cookies if set by Supabase client
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing cookies directly from Server Components.
  // The `createServerClient` function above is used to create a client for Server Components,
  // Route Handlers, and Server Actions. It should not be used to update the session from these contexts.
  // Middleware is the designated place to update the session.

  // Refresh session if expired - crucial for Server Components
  // GET USER PLACED HERE AS IN THE OFFICIAL DOCUMENTATION
  const { data: { user } } = await supabase.auth.getUser();

  // Additional logic based on user or session can be added here if needed
  // For example, redirecting unauthenticated users from protected routes

  return { response: supabaseResponse, supabase, user };
} 
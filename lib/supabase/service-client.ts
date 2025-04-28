import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function createServiceClient() {
  if (serviceClient) return serviceClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables for service client:',
      !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''
    )
    throw new Error('Missing required Supabase environment variables for service client')
  }

  // Log the first few characters of the key for debugging (never log the full key!)
  const keyPrefix = serviceRoleKey.substring(0, 10) + '...'
  console.log(`Creating Supabase service client with URL: ${supabaseUrl} and key prefix: ${keyPrefix}`)
  
  try {
    serviceClient = createClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          fetch: (url, options) => {
            // Log requests in development only
            if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true') {
              console.log(`Supabase service client request: ${options?.method || 'GET'} ${url}`)
            }
            return fetch(url, options)
          }
        }
      }
    )
    
    // Test the client with a simple query to make sure it's working
    if (typeof window === 'undefined') { // Only on server-side
      (async () => {
        try {
          const { count, error } = await serviceClient.from('bookings')
            .select('count(*)', { count: 'exact', head: true });
          
          if (error) {
            console.error('Error testing Supabase service client:', error.message);
          } else {
            console.log(`Supabase service client successfully connected, found ${count || 0} bookings`);
          }
        } catch (err) {
          console.error('Failed to test Supabase service client:', 
            err instanceof Error ? err.message : String(err));
        }
      })();
    }
    
    return serviceClient
  } catch (error) {
    console.error('Error creating Supabase service client:', 
      error instanceof Error ? error.message : String(error))
    throw error
  }
} 
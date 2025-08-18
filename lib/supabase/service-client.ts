import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function createServiceClient() {
  // Ensure we're on the server side
  if (typeof window !== 'undefined') {
    console.error('Service client called from client-side context. This should only be used in server-side code.')
    throw new Error('Service client can only be used on the server side. This function should only be called from API routes, server actions, or other server-side code.')
  }

  if (serviceClient) return serviceClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables for service client')
    throw new Error('Missing required Supabase environment variables')
  }

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
        }
      }
    )
    
    console.log('Supabase service client created successfully')
    return serviceClient
  } catch (error) {
    console.error('Error creating Supabase service client:', error)
    throw error
  }
}

// Add a function to test the service client connection
export async function testServiceClient() {
  try {
    const client = createServiceClient()
    const { data, error } = await client.from('bookings').select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Service client test failed:', error.message)
      return false
    }
    
    console.log('Service client test successful, found', data?.length || 0, 'bookings')
    return true
  } catch (error) {
    console.error('Service client test error:', error instanceof Error ? error.message : String(error))
    return false
  }
} 
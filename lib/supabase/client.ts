import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Singleton implementation for the Supabase client to ensure we only create one instance
// that's used consistently throughout the application
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Define a unique key for the client to ensure we're using the same storage key
const STORAGE_KEY = 'vehicle-inspection-auth'

export const getSupabaseClient = () => {
  // In server components, we need to create a new instance each time
  if (typeof window === 'undefined') {
    return createClientComponentClient<Database>()
  }
  
  // For client components, reuse the same instance
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>({
      cookieOptions: {
        name: STORAGE_KEY
      }
    })
  }
  
  return clientInstance
}

// Export a singleton instance for direct imports
export const supabase = getSupabaseClient() 
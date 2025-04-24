import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Create a single instance of the Supabase client using singleton pattern
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Define a unique key for the client to ensure we're using the same storage key
const STORAGE_KEY = 'vehicle-inspection-auth'

export const supabase = (() => {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    // For server-side, create a new instance each time
    return createClientComponentClient<Database>()
  }
  
  // For client-side, create only one instance with consistent storage key
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>({
      cookieOptions: {
        name: STORAGE_KEY
      }
    })
  }
  
  return clientInstance
})() 
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Create a single instance of the Supabase client using singleton pattern
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const supabase = (() => {
  // Only create a new instance in browser environment
  if (typeof window !== 'undefined') {
    if (!clientInstance) {
      clientInstance = createClientComponentClient<Database>()
    }
    return clientInstance
  }
  
  // Return a new instance for server-side since it doesn't persist anyway
  return createClientComponentClient<Database>()
})() 
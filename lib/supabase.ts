import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Define the type for our Supabase client
type SupabaseClientType = ReturnType<typeof createClient<Database>>

// Use a singleton pattern to ensure only one client instance exists
let supabaseInstance: SupabaseClientType | null = null

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance
  
  // Ensure URL and key are defined before creating client
  supabaseInstance = createClient<Database>(
    supabaseUrl as string,
    supabaseAnonKey as string
  )
  
  return supabaseInstance
})()

// Service client for admin operations
let serviceClient: SupabaseClientType | null = null

export function createServiceClient() {
  if (serviceClient) return serviceClient

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }

  serviceClient = createClient<Database>(
    supabaseUrl as string,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return serviceClient
}

// Initialize the bucket
export async function initStorage() {
  const { data: bucket } = await supabase.storage.getBucket('vehicles')
  
  if (!bucket) {
    await supabase.storage.createBucket('vehicles', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    })
  }
}

// Temporary mock client
export const supabaseMock = {
  // Add any methods you're currently using as mock implementations
  auth: {
    getUser: async () => ({ data: null, error: null }),
  },
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
} 
import { supabase } from './supabase/client'
import { createServiceClient } from './supabase/service-client'

// Re-export the client and service client
export { supabase, createServiceClient }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
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
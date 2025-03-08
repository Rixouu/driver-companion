// Re-export client
export { supabase } from './client'

// Re-export service client
export { createServiceClient } from './service-client'

// Re-export admin functions
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Initialize the bucket
export async function initStorage() {
  const { data: bucket } = await createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ).storage.getBucket('vehicles')
  
  if (!bucket) {
    await createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).storage.createBucket('vehicles', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    })
  }
} 
// Re-export the Supabase client and getSupabaseClient function from client.ts
// This file exists for backward compatibility with existing imports

import { supabase, getSupabaseClient } from './client'

export { supabase, getSupabaseClient }

// Re-export service client
export { createServiceClient } from './service-client'

// Initialize the bucket - use the already imported supabase client
export async function initStorage() {
  const { supabase } = await import('./client')
  
  const { data: bucket } = await supabase.storage.getBucket('vehicles')
  
  if (!bucket) {
    await supabase.storage.createBucket('vehicles', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    })
  }
} 
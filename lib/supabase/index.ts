// Re-export client
export { supabase } from './client'

// Re-export service client
export { createServiceClient } from './service-client'

// Re-export admin functions
import { supabase } from './client'

// Initialize the bucket - reuse the existing client instance
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
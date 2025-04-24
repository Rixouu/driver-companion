// Re-export client
export { supabase } from './client'

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
/**
 * Script to delete all inspections and related data from the database
 * 
 * This script deletes data in the following order to respect foreign key constraints:
 * 1. inspection_photos
 * 2. inspection_items
 * 3. inspections
 * 
 * Run with: npx ts-node scripts/delete-inspections.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.')
  process.exit(1)
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function deleteAllInspections() {
  console.log('Starting deletion of all inspection data...')

  try {
    // Step 1: Delete all inspection photos
    console.log('Deleting inspection photos...')
    const { error: photosError } = await supabase
      .from('inspection_photos')
      .delete()
      .neq('id', '')
    
    if (photosError) {
      throw new Error(`Error deleting inspection photos: ${photosError.message}`)
    }
    console.log('✅ Inspection photos deleted successfully')

    // Step 2: Delete all inspection items
    console.log('Deleting inspection items...')
    const { error: itemsError } = await supabase
      .from('inspection_items')
      .delete()
      .neq('id', '')
    
    if (itemsError) {
      throw new Error(`Error deleting inspection items: ${itemsError.message}`)
    }
    console.log('✅ Inspection items deleted successfully')

    // Step 3: Delete all inspections
    console.log('Deleting inspections...')
    const { error: inspectionsError } = await supabase
      .from('inspections')
      .delete()
      .neq('id', '')
    
    if (inspectionsError) {
      throw new Error(`Error deleting inspections: ${inspectionsError.message}`)
    }
    console.log('✅ Inspections deleted successfully')

    console.log('🎉 All inspection data has been successfully deleted!')
  } catch (error) {
    console.error('Error during deletion process:', error)
    process.exit(1)
  }
}

// Execute the deletion function
deleteAllInspections() 
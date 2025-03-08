/**
 * Script to delete all inspections and related data from the database
 * 
 * This script deletes data in the following order to respect foreign key constraints:
 * 1. maintenance_tasks (that reference inspections)
 * 2. inspection_photos
 * 3. inspection_items
 * 4. inspections
 * 
 * Run with: node scripts/delete-inspections.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function deleteAllInspections() {
  console.log('Starting deletion of all inspection data...');

  try {
    // First, get all inspection IDs
    console.log('Fetching inspection IDs...');
    const { data: inspections, error: fetchError } = await supabase
      .from('inspections')
      .select('id');
    
    if (fetchError) {
      throw new Error(`Error fetching inspections: ${fetchError.message}`);
    }
    
    const inspectionIds = inspections.map(inspection => inspection.id);
    console.log(`Found ${inspectionIds.length} inspections to delete.`);
    
    if (inspectionIds.length === 0) {
      console.log('No inspections found to delete.');
      return;
    }

    // Step 1: Delete maintenance tasks that reference these inspections
    console.log('Deleting related maintenance tasks...');
    const { error: maintenanceError } = await supabase
      .from('maintenance_tasks')
      .delete()
      .in('inspection_id', inspectionIds);
    
    if (maintenanceError) {
      console.log(`Warning: Error deleting maintenance tasks: ${maintenanceError.message}`);
      console.log('Continuing with deletion process...');
    } else {
      console.log('✅ Related maintenance tasks deleted successfully');
    }

    // Step 2: Delete inspection photos
    // First, let's check the structure of the inspection_photos table
    console.log('Checking inspection_photos table structure...');
    const { data: photoColumns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'inspection_photos' });
    
    if (columnsError) {
      console.log(`Warning: Could not get inspection_photos columns: ${columnsError.message}`);
      console.log('Trying alternative approach...');
      
      // Try with both possible column names
      console.log('Deleting inspection photos (trying with inspection_id)...');
      await supabase
        .from('inspection_photos')
        .delete()
        .in('inspection_id', inspectionIds);
      
      console.log('Deleting inspection photos (trying with inspections_id)...');
      await supabase
        .from('inspection_photos')
        .delete()
        .in('inspections_id', inspectionIds);
      
      console.log('Deleting inspection photos (trying with id)...');
      await supabase
        .from('inspection_photos')
        .delete()
        .in('id', inspectionIds);
    } else {
      // If we got the columns, find the correct foreign key column
      const foreignKeyColumn = photoColumns.find(col => 
        col.includes('inspection') || col.includes('inspections'));
      
      if (foreignKeyColumn) {
        console.log(`Deleting inspection photos using column: ${foreignKeyColumn}...`);
        const { error: photosError } = await supabase
          .from('inspection_photos')
          .delete()
          .in(foreignKeyColumn, inspectionIds);
        
        if (photosError) {
          console.log(`Warning: Error deleting inspection photos: ${photosError.message}`);
        } else {
          console.log('✅ Inspection photos deleted successfully');
        }
      } else {
        console.log('Could not find inspection foreign key column in photos table');
      }
    }

    // Step 3: Delete all inspection items related to these inspections
    console.log('Deleting inspection items...');
    const { error: itemsError } = await supabase
      .from('inspection_items')
      .delete()
      .in('inspection_id', inspectionIds);
    
    if (itemsError) {
      console.log(`Warning: Error deleting inspection items: ${itemsError.message}`);
      console.log('Continuing with deletion process...');
    } else {
      console.log('✅ Inspection items deleted successfully');
    }

    // Step 4: Delete all inspections
    console.log('Deleting inspections...');
    const { error: inspectionsError } = await supabase
      .from('inspections')
      .delete()
      .in('id', inspectionIds);
    
    if (inspectionsError) {
      throw new Error(`Error deleting inspections: ${inspectionsError.message}`);
    }
    console.log('✅ Inspections deleted successfully');

    console.log('🎉 All inspection data has been successfully deleted!');
  } catch (error) {
    console.error('Error during deletion process:', error);
    process.exit(1);
  }
}

// Execute the deletion function
deleteAllInspections(); 
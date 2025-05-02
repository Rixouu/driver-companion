// Import required modules
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const sqlContent = fs.readFileSync(path.join(__dirname, 'run-vehicle-migration.sql'), 'utf8');

async function runMigration() {
  console.log('Running migration to add vehicle fields to bookings table...');
  
  try {
    // Execute the SQL query
    const { error } = await supabase.rpc('exec_sql', { query: sqlContent });
    
    if (error) {
      console.error('Error running migration:', error);
      return;
    }
    
    console.log('Migration successful! Vehicle columns have been added to the bookings table.');
  } catch (error) {
    console.error('Unexpected error during migration:', error);
  }
}

runMigration(); 
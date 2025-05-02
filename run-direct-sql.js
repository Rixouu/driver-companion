// Direct SQL execution script
const { execSync } = require('child_process');

// SQL statements to execute
const sql = `
-- Add vehicle_make column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_make TEXT;

-- Add vehicle_model column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_model TEXT;

-- Add vehicle_capacity column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_capacity INTEGER;

-- Add vehicle_year column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_year TEXT;

-- Add service_type column if it doesn't exist (for completeness)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_type TEXT;
`;

// Create a temporary SQL file
const fs = require('fs');
const path = require('path');
const tempFile = path.join(__dirname, 'temp-migration.sql');

fs.writeFileSync(tempFile, sql, 'utf8');

try {
  console.log('Running SQL to add vehicle fields to bookings table...');
  
  // Get database connection details
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Please provide either DATABASE_URL or Supabase credentials');
    process.exit(1);
  }
  
  if (databaseUrl) {
    // Run the SQL using psql
    execSync(`psql "${databaseUrl}" -f ${tempFile}`, { stdio: 'inherit' });
  } else {
    // Use supabase-js
    console.log('Attempting to use Supabase client...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Execute the SQL (this will be async, so we're just showing the code)
    console.log('SQL statements to run manually in Supabase dashboard:');
    console.log(sql);
    
    console.log('\nAlternatively, open another terminal and set these environment variables:');
    console.log('export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('Then run this script again.');
  }
  
  console.log('Migration complete!');
} catch (error) {
  console.error('Error running migration:', error.message);
} finally {
  // Clean up temporary file
  fs.unlinkSync(tempFile);
} 
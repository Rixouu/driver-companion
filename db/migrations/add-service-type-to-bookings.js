const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Role Key is missing.');
  console.error('Make sure to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addServiceTypeToBookings() {
  console.log('Adding service_type column to bookings table...');
  
  try {
    // Use raw SQL query to add the column
    const { error } = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_type TEXT;`
    });
    
    if (error) {
      console.error('Error adding service_type column:', error);
      return false;
    }
    
    console.log('Successfully added service_type column to bookings table.');
    return true;
  } catch (error) {
    console.error('Unexpected error during migration:', error);
    return false;
  }
}

// Run the migration
addServiceTypeToBookings()
  .then((success) => {
    if (success) {
      console.log('Migration completed successfully!');
      process.exit(0);
    } else {
      console.error('Migration failed.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unhandled error during migration:', error);
    process.exit(1);
  }); 
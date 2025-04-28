#!/usr/bin/env node

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  console.log('Loaded environment variables from .env.local');
} else {
  console.log('No .env.local file found, using process environment variables');
}

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: Missing Supabase credentials');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('\x1b[36m%s\x1b[0m', '🔍 Checking Supabase database tables...');
  
  try {
    // Get list of tables using system tables (requires service role key)
    const { data: tables, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error querying tables:', error.message);
      
      // Try alternate approach using introspection
      console.log('Trying alternate approach...');
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);
      
      if (bookingsError) {
        if (bookingsError.code === 'PGRST204') {
          console.error('\x1b[31m%s\x1b[0m', '❌ The bookings table does not exist!');
          console.log('You need to create the bookings table before syncing WordPress data.');
          console.log('Run the migrations script at db/migrations/bookings.sql');
        } else {
          console.error('\x1b[31m%s\x1b[0m', '❌ Error querying bookings table:', bookingsError.message);
        }
        process.exit(1);
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ Bookings table exists!');
        console.log('Table structure:', Object.keys(bookings?.[0] || {}).join(', '));
      }
      
      return;
    }
    
    // Check if bookings table exists
    const bookingsTable = tables.find(t => t.tablename === 'bookings');
    
    if (!bookingsTable) {
      console.error('\x1b[31m%s\x1b[0m', '❌ The bookings table does not exist!');
      console.log('You need to create the bookings table before syncing WordPress data.');
      console.log('Run the migrations script at db/migrations/bookings.sql');
      process.exit(1);
    }
    
    console.log('\x1b[32m%s\x1b[0m', '✅ Bookings table exists!');
    
    // Check table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'bookings')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error fetching table structure:', columnsError.message);
    } else {
      console.log('\x1b[32m%s\x1b[0m', '✅ Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check for wp_meta column and its type
      const wpMetaColumn = columns.find(col => col.column_name === 'wp_meta');
      if (wpMetaColumn) {
        if (wpMetaColumn.data_type === 'jsonb') {
          console.log('\x1b[32m%s\x1b[0m', '✅ wp_meta column is JSONB type, which is correct!');
        } else {
          console.warn('\x1b[33m%s\x1b[0m', `⚠️ wp_meta column is ${wpMetaColumn.data_type} type, should be JSONB!`);
        }
      } else {
        console.error('\x1b[31m%s\x1b[0m', '❌ wp_meta column not found in bookings table!');
      }
    }
    
    // Check if there are any existing bookings
    const { data: bookingCount, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error counting bookings:', countError.message);
    } else {
      const count = bookingCount.length;
      console.log(`\n${count} bookings found in the database.`);
      
      if (count === 0) {
        console.log('\x1b[33m%s\x1b[0m', '⚠️ No bookings in the database. Run the sync to populate it.');
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ The database already has bookings!');
      }
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables(); 
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

async function insertTestBooking() {
  console.log('\x1b[36m%s\x1b[0m', '🔍 Testing booking insertion with correct wp_meta format...');
  
  // Example booking data with wp_meta as a proper JSON object
  const testBooking = {
    wp_id: 'test-' + Date.now(),  // Unique test ID
    customer_name: 'Test Customer',
    service_name: 'Test Service',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    time: '09:00',
    status: 'scheduled',
    wp_meta: {  // This is a proper JSON object, not a string
      order_id: 12345,
      payment_method: 'credit_card',
      vehicle_type: 'sedan',
      customer_email: 'test@example.com',
      customer_phone: '555-123-4567',
      price: '99.99',
      additional_notes: 'This is a test booking created via the test script'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // First, check if the test booking already exists
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('*')
      .eq('wp_id', testBooking.wp_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error checking for existing test booking:', checkError.message);
      process.exit(1);
    }
    
    if (existingBooking) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Test booking already exists, updating it...');
      
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update(testBooking)
        .eq('wp_id', testBooking.wp_id)
        .select()
        .single();
      
      if (updateError) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Error updating test booking:', updateError.message);
        process.exit(1);
      }
      
      console.log('\x1b[32m%s\x1b[0m', '✅ Successfully updated test booking!');
      console.log('Booking ID:', updatedBooking.id);
      console.log('wp_meta content type:', typeof updatedBooking.wp_meta);
      console.log('wp_meta:', JSON.stringify(updatedBooking.wp_meta, null, 2));
    } else {
      // Insert new test booking
      const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert(testBooking)
        .select()
        .single();
      
      if (insertError) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Error inserting test booking:', insertError.message);
        
        if (insertError.message.includes('type')) {
          console.log('\n\x1b[33m%s\x1b[0m', '⚠️ This appears to be a type error with wp_meta.');
          console.log('Trying an alternative approach with stringified JSON...');
          
          // Try with stringified JSON
          const bookingWithStringMeta = {
            ...testBooking,
            wp_meta: JSON.stringify(testBooking.wp_meta)
          };
          
          const { data: altBooking, error: altError } = await supabase
            .from('bookings')
            .insert(bookingWithStringMeta)
            .select()
            .single();
            
          if (altError) {
            console.error('\x1b[31m%s\x1b[0m', '❌ Alternative approach also failed:', altError.message);
          } else {
            console.log('\x1b[32m%s\x1b[0m', '✅ Successfully inserted test booking using stringified JSON!');
            console.log('Booking ID:', altBooking.id);
            console.log('wp_meta content type:', typeof altBooking.wp_meta);
            if (typeof altBooking.wp_meta === 'string') {
              try {
                const parsedMeta = JSON.parse(altBooking.wp_meta);
                console.log('wp_meta parsed from string:', JSON.stringify(parsedMeta, null, 2));
              } catch (parseError) {
                console.log('wp_meta (raw):', altBooking.wp_meta);
              }
            } else {
              console.log('wp_meta:', JSON.stringify(altBooking.wp_meta, null, 2));
            }
          }
        }
        
        process.exit(1);
      }
      
      console.log('\x1b[32m%s\x1b[0m', '✅ Successfully inserted test booking!');
      console.log('Booking ID:', newBooking.id);
      console.log('wp_meta content type:', typeof newBooking.wp_meta);
      console.log('wp_meta:', JSON.stringify(newBooking.wp_meta, null, 2));
    }
    
    // Read the booking back to verify structure
    console.log('\n\x1b[36m%s\x1b[0m', '🔍 Verifying booking in database...');
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select('*')
      .eq('wp_id', testBooking.wp_id)
      .single();
      
    if (verifyError) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error verifying booking:', verifyError.message);
    } else {
      console.log('\x1b[32m%s\x1b[0m', '✅ Booking verified in database:');
      console.log('ID:', verifyBooking.id);
      console.log('wp_id:', verifyBooking.wp_id);
      console.log('wp_meta type:', typeof verifyBooking.wp_meta);
      console.log('wp_meta content:', JSON.stringify(verifyBooking.wp_meta, null, 2));
    }
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error:', error.message);
    process.exit(1);
  }
}

insertTestBooking(); 
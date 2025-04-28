#!/usr/bin/env node
/**
 * Test script for WordPress to Supabase sync
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
console.log('Loaded environment variables from .env.local');

// Import the createClient function and fetch
const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// WordPress API information
const wpApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const wpApiKey = process.env.NEXT_PUBLIC_WORDPRESS_API_KEY;
const wpApiCustomPath = process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH;

// Constants for color output
const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
};

/**
 * Fetches bookings from WordPress API
 */
async function fetchWordPressBookings() {
  console.log(chalk.blue('Fetching bookings from WordPress API...'));
  
  // Build the endpoint URL
  const baseUrl = wpApiUrl.endsWith('/') ? wpApiUrl.slice(0, -1) : wpApiUrl;
  let endpointUrl;
  
  if (wpApiCustomPath) {
    const customPath = wpApiCustomPath.startsWith('/') ? wpApiCustomPath : `/${wpApiCustomPath}`;
    endpointUrl = `${baseUrl}${customPath}?limit=1`;
  } else {
    endpointUrl = `${baseUrl}/wp-json/driver/v1/bookings?limit=1`;
  }
  
  console.log(`Testing endpoint: ${endpointUrl}`);
  
  // Try with Bearer token
  try {
    console.log(chalk.gray('Trying with Bearer token...'));
    const response = await fetch(endpointUrl, {
      headers: {
        'Authorization': `Bearer ${wpApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(chalk.green('✅ Success with Bearer token!'));
      
      // Check data structure
      if (data.data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} bookings in standard format`);
        console.log('Sample booking:', JSON.stringify(data.data[0], null, 2).substring(0, 500) + '...');
        return data.data;
      } else if (Array.isArray(data)) {
        console.log(`Found ${data.length} bookings in direct array format`);
        console.log('Sample booking:', JSON.stringify(data[0], null, 2).substring(0, 500) + '...');
        return data;
      } else {
        console.log('Unexpected data format:', Object.keys(data).join(', '));
      }
    } else {
      console.log(chalk.yellow(`❌ Failed with Bearer token: ${response.status}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error with Bearer token: ${error.message}`));
  }
  
  // Try with X-API-Key header
  try {
    console.log(chalk.gray('Trying with X-API-Key header...'));
    const response = await fetch(endpointUrl, {
      headers: {
        'X-API-Key': wpApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(chalk.green('✅ Success with X-API-Key header!'));
      
      // Check data structure
      if (data.data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} bookings in standard format`);
        console.log('Sample booking:', JSON.stringify(data.data[0], null, 2).substring(0, 500) + '...');
        return data.data;
      } else if (Array.isArray(data)) {
        console.log(`Found ${data.length} bookings in direct array format`);
        console.log('Sample booking:', JSON.stringify(data[0], null, 2).substring(0, 500) + '...');
        return data;
      } else {
        console.log('Unexpected data format:', Object.keys(data).join(', '));
      }
    } else {
      console.log(chalk.yellow(`❌ Failed with X-API-Key header: ${response.status}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error with X-API-Key header: ${error.message}`));
  }
  
  // Try with query parameter
  try {
    console.log(chalk.gray('Trying with api_key query parameter...'));
    const url = `${endpointUrl}&api_key=${wpApiKey}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(chalk.green('✅ Success with api_key query parameter!'));
      
      // Check data structure
      if (data.data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} bookings in standard format`);
        console.log('Sample booking:', JSON.stringify(data.data[0], null, 2).substring(0, 500) + '...');
        return data.data;
      } else if (Array.isArray(data)) {
        console.log(`Found ${data.length} bookings in direct array format`);
        console.log('Sample booking:', JSON.stringify(data[0], null, 2).substring(0, 500) + '...');
        return data;
      } else {
        console.log('Unexpected data format:', Object.keys(data).join(', '));
      }
    } else {
      console.log(chalk.yellow(`❌ Failed with api_key query parameter: ${response.status}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error with api_key query parameter: ${error.message}`));
  }
  
  console.log(chalk.red('❌ All authentication methods failed.'));
  return null;
}

/**
 * Tests Supabase connections and permissions
 */
async function testSupabaseConnection() {
  console.log(chalk.blue('Testing Supabase connection...'));
  
  try {
    // Try to count bookings
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(chalk.red(`❌ Supabase query error: ${error.message}`));
      return false;
    }
    
    console.log(chalk.green(`✅ Successfully connected to Supabase. Found ${count} bookings.`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Supabase connection error: ${error.message}`));
    return false;
  }
}

/**
 * Syncs a booking to Supabase
 */
async function syncBookingToSupabase(booking) {
  console.log(chalk.blue(`Syncing booking ${booking.id} to Supabase...`));
  
  try {
    // Check if this booking already exists
    const { data: existingBooking, error: queryError } = await supabase
      .from('bookings')
      .select('*')
      .eq('wp_id', String(booking.id))
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "Did not find a single row"
      console.error(chalk.red(`Error checking for existing booking: ${queryError.message}`));
      return false;
    }
    
    // Map WordPress booking to Supabase structure
    const now = new Date().toISOString();
    
    // Handle date properly - could be in various formats
    let bookingDate = booking.date;
    if (booking.date && booking.date.includes(' ')) {
      // If date is in format like "2025-04-27 23:02:09"
      bookingDate = booking.date.split(' ')[0];
    }
    
    // Handle time properly
    let bookingTime = booking.time || '00:00';
    if (booking.date && booking.date.includes(' ')) {
      // If date is in format like "2025-04-27 23:02:09"
      bookingTime = booking.date.split(' ')[1].substring(0, 5); // Get HH:MM
    }
    
    // Check for pickup time in meta
    if (booking.meta && booking.meta.chbs_pickup_time) {
      bookingTime = booking.meta.chbs_pickup_time;
    }
    
    // Check for pickup date in meta
    if (booking.meta && booking.meta.chbs_pickup_date) {
      const parts = booking.meta.chbs_pickup_date.split('-');
      if (parts.length === 3) {
        // Convert from DD-MM-YYYY to YYYY-MM-DD
        bookingDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // Get pickup and dropoff locations
    let pickupLocation = null;
    let dropoffLocation = null;
    
    if (booking.meta && booking.meta.chbs_coordinate && Array.isArray(booking.meta.chbs_coordinate)) {
      if (booking.meta.chbs_coordinate.length > 0 && booking.meta.chbs_coordinate[0].address) {
        pickupLocation = booking.meta.chbs_coordinate[0].address;
      }
      
      if (booking.meta.chbs_coordinate.length > 1 && booking.meta.chbs_coordinate[1].address) {
        dropoffLocation = booking.meta.chbs_coordinate[1].address;
      }
    }
    
    // Build booking data
    const bookingData = {
      wp_id: String(booking.id),
      service_name: booking.title || 'Unknown Service',
      date: bookingDate,
      time: bookingTime,
      status: booking.status || 'pending',
      customer_name: booking.meta?.chbs_client_contact_detail_first_name 
        ? `${booking.meta.chbs_client_contact_detail_first_name} ${booking.meta.chbs_client_contact_detail_last_name || ''}`
        : null,
      customer_email: booking.meta?.chbs_client_contact_detail_email_address || null,
      customer_phone: booking.meta?.chbs_client_contact_detail_phone_number || null,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      distance: booking.meta?.chbs_distance || null,
      duration: booking.meta?.chbs_duration || null,
      notes: booking.meta?.chbs_comment || null,
      wp_meta: booking.meta || null,
      created_at: now,
      updated_at: now,
      synced_at: now
    };
    
    console.log('Mapped booking data:', JSON.stringify(bookingData, null, 2));
    
    if (existingBooking) {
      console.log(`Booking ${booking.id} already exists, updating...`);
      
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          ...bookingData,
          updated_at: now,
          synced_at: now
        })
        .eq('wp_id', String(booking.id))
        .select('id');
      
      if (updateError) {
        console.error(chalk.red(`Error updating booking: ${updateError.message}`));
        return false;
      }
      
      console.log(chalk.green(`✅ Successfully updated booking ${booking.id}`));
      return true;
    } else {
      console.log(`Booking ${booking.id} is new, inserting...`);
      
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id');
      
      if (insertError) {
        console.error(chalk.red(`Error inserting booking: ${insertError.message}`));
        console.error('Booking data:', JSON.stringify(bookingData, null, 2));
        return false;
      }
      
      console.log(chalk.green(`✅ Successfully inserted booking ${booking.id} with Supabase ID ${data?.[0]?.id}`));
      return true;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error syncing booking: ${error.message}`));
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue('🔄 WordPress to Supabase Sync Test'));
  console.log('='.repeat(50));
  
  // Test Supabase connection
  const supabaseConnected = await testSupabaseConnection();
  if (!supabaseConnected) {
    console.error(chalk.red('Supabase connection failed. Cannot continue with sync test.'));
    return;
  }
  
  // Fetch WordPress bookings
  const bookings = await fetchWordPressBookings();
  if (!bookings || bookings.length === 0) {
    console.error(chalk.red('Could not fetch any bookings from WordPress. Cannot continue with sync test.'));
    return;
  }
  
  // Test syncing one booking
  console.log('='.repeat(50));
  console.log(chalk.blue(`Testing sync with booking ${bookings[0].id}...`));
  
  const syncResult = await syncBookingToSupabase(bookings[0]);
  
  if (syncResult) {
    console.log(chalk.green('✅ Sync test successful!'));
    
    // Count bookings in database after sync
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`There are now ${count} bookings in the database.`);
  } else {
    console.log(chalk.red('❌ Sync test failed.'));
  }
}

// Run the test
main().catch(error => {
  console.error(chalk.red(`❌ Uncaught error: ${error.message}`));
  console.error(error);
}); 
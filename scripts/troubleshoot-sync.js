#!/usr/bin/env node
/**
 * Troubleshooting script for WordPress to Supabase sync
 * 
 * This script checks:
 * 1. WordPress API connection and authentication
 * 2. Supabase connection and permissions
 * 3. Data mapping between WordPress and Supabase
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
console.log('Loaded environment variables from .env.local');

const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Constants for color output
const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
};

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// WordPress API configuration
const wpApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.WORDPRESS_API_URL;
const wpApiKey = process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || process.env.WORDPRESS_API_KEY;
const wpApiCustomPath = process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH || process.env.WORDPRESS_API_CUSTOM_PATH;

async function troubleshootWordPressAPI() {
  console.log(chalk.blue('🔍 Checking WordPress API connection...'));
  
  // Check environment variables
  if (!wpApiUrl) {
    console.error(chalk.red('❌ WordPress API URL not configured!'));
    console.log('Please set WORDPRESS_API_URL or NEXT_PUBLIC_WORDPRESS_API_URL');
    return false;
  }
  
  if (!wpApiKey) {
    console.warn(chalk.yellow('⚠️ WordPress API key not configured!'));
    console.log('This may cause authentication issues. Set WORDPRESS_API_KEY or NEXT_PUBLIC_WORDPRESS_API_KEY');
  }
  
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
  
  // Try with different auth methods
  const authMethods = [
    { 
      name: 'Bearer token', 
      headers: { 
        'Authorization': `Bearer ${wpApiKey}`,
        'Content-Type': 'application/json'
      }
    },
    { 
      name: 'X-API-Key header', 
      headers: { 
        'X-API-Key': wpApiKey,
        'Content-Type': 'application/json'
      }
    },
    { 
      name: 'Query parameter', 
      url: `${endpointUrl}&api_key=${wpApiKey}`,
      headers: { 'Content-Type': 'application/json' }
    }
  ];
  
  let success = false;
  let bookingsData = null;
  
  for (const method of authMethods) {
    try {
      const url = method.url || endpointUrl;
      console.log(chalk.gray(`Trying with ${method.name}...`));
      
      const response = await fetch(url, { headers: method.headers });
      const contentType = response.headers.get('content-type');
      
      console.log(`HTTP Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(chalk.green(`✅ Success with ${method.name}!`));
        console.log(`Response data structure: ${Object.keys(data).join(', ')}`);
        
        if (data.data && Array.isArray(data.data)) {
          bookingsData = data.data;
          console.log(`Found ${bookingsData.length} bookings in response.data`);
        } else if (Array.isArray(data)) {
          bookingsData = data;
          console.log(`Found ${bookingsData.length} bookings in direct array`);
        } else if (data.bookings && Array.isArray(data.bookings)) {
          bookingsData = data.bookings;
          console.log(`Found ${bookingsData.length} bookings in response.bookings`);
        }
        
        if (bookingsData && bookingsData.length > 0) {
          console.log('Sample booking data:');
          console.log(JSON.stringify(bookingsData[0], null, 2));
        } else {
          console.warn(chalk.yellow('⚠️ No bookings found in response'));
        }
        
        success = true;
        break;
      } else {
        const errorData = await response.text();
        console.error(chalk.red(`❌ Failed with ${method.name}: ${response.status}`));
        try {
          const jsonError = JSON.parse(errorData);
          console.error(chalk.red(`Error details: ${JSON.stringify(jsonError)}`));
        } catch {
          console.error(chalk.red(`Error response: ${errorData.substring(0, 150)}...`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error with ${method.name}: ${error.message}`));
    }
  }
  
  return { success, bookingsData };
}

async function troubleshootSupabase() {
  console.log(chalk.blue('🔍 Checking Supabase connection...'));
  
  if (!supabaseUrl) {
    console.error(chalk.red('❌ Supabase URL not configured!'));
    return false;
  }
  
  if (!supabaseKey) {
    console.error(chalk.red('❌ Supabase service role key not configured!'));
    return false;
  }
  
  try {
    // Check connection with a simple query
    const { data, error } = await supabase.from('bookings').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error(chalk.red(`❌ Supabase query error: ${error.message}`));
      return false;
    }
    
    console.log(chalk.green('✅ Supabase connection successful!'));
    
    // Check if bookings table exists by counting records
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error(chalk.red(`❌ Error counting bookings: ${countError.message}`));
      return false;
    }
    
    console.log(`${count} bookings found in the database`);
    
    // Test insert permission
    console.log('Testing Supabase insert permission...');
    const testId = `test-${Date.now()}`;
    
    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        wp_id: testId,
        service_name: 'Test Service',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
      });
    
    if (insertError) {
      console.error(chalk.red(`❌ Insert permission error: ${insertError.message}`));
      return false;
    }
    
    console.log(chalk.green('✅ Insert permission test successful!'));
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('wp_id', testId);
    
    if (deleteError) {
      console.warn(chalk.yellow(`⚠️ Cleanup error: ${deleteError.message}`));
    } else {
      console.log('Test data cleaned up successfully');
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Supabase connection error: ${error.message}`));
    return false;
  }
}

async function run() {
  console.log(chalk.blue('🔧 WordPress to Supabase Sync Troubleshooter'));
  console.log(chalk.gray('========================================='));
  
  // Check WordPress API
  const wpResult = await troubleshootWordPressAPI();
  console.log(chalk.gray('========================================='));
  
  // Check Supabase
  const supabaseResult = await troubleshootSupabase();
  console.log(chalk.gray('========================================='));
  
  // Summary
  console.log(chalk.blue('📊 Troubleshooting Summary:'));
  console.log(`WordPress API: ${wpResult.success ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  console.log(`Supabase: ${supabaseResult ? chalk.green('✅ Working') : chalk.red('❌ Failed')}`);
  
  if (wpResult.success && supabaseResult) {
    console.log(chalk.green('🎉 Your system appears to be configured correctly!'));
    
    if (wpResult.bookingsData && wpResult.bookingsData.length > 0) {
      console.log(chalk.green('✅ WordPress API is returning bookings data.'));
    } else {
      console.warn(chalk.yellow('⚠️ WordPress API is working but returned no bookings.'));
    }
  } else {
    console.log(chalk.red('❌ There are issues with your configuration that need to be resolved.'));
    
    if (!wpResult.success) {
      console.log(chalk.yellow('📌 Fix WordPress API issues:'));
      console.log('  - Check API URL and key in .env.local');
      console.log('  - Ensure WordPress API is properly configured');
      console.log('  - Verify authentication method (header vs query param)');
    }
    
    if (!supabaseResult) {
      console.log(chalk.yellow('📌 Fix Supabase issues:'));
      console.log('  - Check Supabase URL and service role key in .env.local');
      console.log('  - Ensure bookings table exists with correct schema');
      console.log('  - Verify RLS policies allow service role to insert/update records');
    }
  }
}

// Run the troubleshooter
run().catch(error => {
  console.error(chalk.red(`❌ Uncaught error: ${error.message}`));
  console.error(error);
  process.exit(1);
}); 
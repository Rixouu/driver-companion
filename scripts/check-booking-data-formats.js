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

async function analyzeBookingData() {
  console.log('\x1b[36m%s\x1b[0m', '🔍 Analyzing booking data for format issues...');
  
  try {
    // First, get the total count of bookings
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error counting bookings:', countError.message);
      process.exit(1);
    }
    
    console.log(`Total bookings found: ${count}`);
    
    if (count === 0) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ No bookings found in the database.');
      process.exit(0);
    }
    
    // Get all bookings to analyze
    console.log('\x1b[36m%s\x1b[0m', 'Fetching all bookings for analysis...');
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*');
    
    if (fetchError) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error fetching bookings:', fetchError.message);
      process.exit(1);
    }
    
    console.log(`Successfully fetched ${bookings.length} bookings.`);
    
    // Analyze wp_meta format for each booking
    const analysis = {
      total: bookings.length,
      wpMetaTypes: {},
      objectMetaFormat: 0,
      stringMetaFormat: 0,
      nullMeta: 0,
      parsableStringMeta: 0,
      unparsableStringMeta: 0,
      problematicBookings: []
    };
    
    bookings.forEach((booking, index) => {
      const metaType = typeof booking.wp_meta;
      
      // Count types
      if (!analysis.wpMetaTypes[metaType]) {
        analysis.wpMetaTypes[metaType] = 1;
      } else {
        analysis.wpMetaTypes[metaType]++;
      }
      
      // Analyze in detail
      if (booking.wp_meta === null) {
        analysis.nullMeta++;
      } else if (metaType === 'object') {
        analysis.objectMetaFormat++;
      } else if (metaType === 'string') {
        analysis.stringMetaFormat++;
        
        // Check if the string is valid JSON
        try {
          JSON.parse(booking.wp_meta);
          analysis.parsableStringMeta++;
        } catch (e) {
          analysis.unparsableStringMeta++;
          analysis.problematicBookings.push({
            id: booking.id,
            wp_id: booking.wp_id,
            issue: 'Unparsable wp_meta string',
            wp_meta: booking.wp_meta.substring(0, 100) + (booking.wp_meta.length > 100 ? '...' : '')
          });
        }
      } else {
        // Any other unexpected type
        analysis.problematicBookings.push({
          id: booking.id,
          wp_id: booking.wp_id,
          issue: `Unexpected wp_meta type: ${metaType}`,
          wp_meta: String(booking.wp_meta).substring(0, 100) + (String(booking.wp_meta).length > 100 ? '...' : '')
        });
      }
      
      // Check for empty strings or empty objects
      if (metaType === 'string' && booking.wp_meta.trim() === '') {
        analysis.problematicBookings.push({
          id: booking.id,
          wp_id: booking.wp_id,
          issue: 'Empty wp_meta string',
          wp_meta: ''
        });
      } else if (metaType === 'object' && Object.keys(booking.wp_meta).length === 0) {
        analysis.problematicBookings.push({
          id: booking.id,
          wp_id: booking.wp_id,
          issue: 'Empty wp_meta object',
          wp_meta: '{}'
        });
      }
      
      // Print progress for larger datasets
      if (bookings.length > 100 && index % 100 === 0) {
        console.log(`Progress: ${index}/${bookings.length} bookings analyzed...`);
      }
    });
    
    // Print analysis results
    console.log('\n\x1b[36m%s\x1b[0m', '📊 Analysis Results:');
    console.log('\x1b[33m%s\x1b[0m', '----------------------------------------');
    console.log('Total bookings:', analysis.total);
    console.log('wp_meta type distribution:');
    for (const [type, count] of Object.entries(analysis.wpMetaTypes)) {
      const percentage = ((count / analysis.total) * 100).toFixed(2);
      console.log(`  - ${type}: ${count} (${percentage}%)`);
    }
    console.log('\nDetailed breakdown:');
    console.log(`  - Object format: ${analysis.objectMetaFormat}`);
    console.log(`  - String format: ${analysis.stringMetaFormat}`);
    console.log(`    - Parsable JSON strings: ${analysis.parsableStringMeta}`);
    console.log(`    - Unparsable strings: ${analysis.unparsableStringMeta}`);
    console.log(`  - Null values: ${analysis.nullMeta}`);
    console.log('\x1b[33m%s\x1b[0m', '----------------------------------------');
    
    // Problematic bookings report
    if (analysis.problematicBookings.length > 0) {
      console.log('\n\x1b[31m%s\x1b[0m', '⚠️ Problematic Bookings Detected:');
      console.log('\x1b[33m%s\x1b[0m', '----------------------------------------');
      analysis.problematicBookings.forEach((booking, index) => {
        console.log(`\n[${index + 1}] Booking ID: ${booking.id} (wp_id: ${booking.wp_id})`);
        console.log(`    Issue: ${booking.issue}`);
        console.log(`    wp_meta: ${booking.wp_meta}`);
      });
      console.log('\x1b[33m%s\x1b[0m', '----------------------------------------');
      console.log(`\nTotal problematic bookings: ${analysis.problematicBookings.length} (${((analysis.problematicBookings.length / analysis.total) * 100).toFixed(2)}% of total)`);
    } else {
      console.log('\n\x1b[32m%s\x1b[0m', '✅ No problematic bookings detected!');
    }
    
    // Recommendations
    console.log('\n\x1b[36m%s\x1b[0m', '🛠 Recommendations:');
    
    if (analysis.objectMetaFormat > 0 && analysis.stringMetaFormat > 0) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Mixed wp_meta formats detected (both object and string).');
      console.log('Consider standardizing to one format, preferably object format for JSONB column.');
      
      if (analysis.parsableStringMeta > 0) {
        console.log('\nYou could run a migration script to convert parsable strings to objects:');
        console.log('```');
        console.log('const { data: stringMetaBookings } = await supabase');
        console.log('  .from("bookings")');
        console.log('  .select("*")');
        console.log('  .eq("status", "actual_status"); // Add filters if necessary');
        console.log('');
        console.log('for (const booking of stringMetaBookings) {');
        console.log('  if (typeof booking.wp_meta === "string") {');
        console.log('    try {');
        console.log('      const parsedMeta = JSON.parse(booking.wp_meta);');
        console.log('      await supabase');
        console.log('        .from("bookings")');
        console.log('        .update({ wp_meta: parsedMeta })');
        console.log('        .eq("id", booking.id);');
        console.log('    } catch (e) {');
        console.log('      console.error(`Error parsing booking ${booking.id}:`, e);');
        console.log('    }');
        console.log('  }');
        console.log('}');
        console.log('```');
      }
    } else if (analysis.stringMetaFormat > 0 && analysis.parsableStringMeta === analysis.stringMetaFormat) {
      console.log('\x1b[33m%s\x1b[0m', '⚠️ All wp_meta values are strings, but they are all valid JSON.');
      console.log('Consider converting them to objects to better utilize the JSONB column type.');
    } else if (analysis.unparsableStringMeta > 0) {
      console.log('\x1b[31m%s\x1b[0m', '❌ Unparsable string wp_meta values detected.');
      console.log('These may need manual review and correction.');
    }
    
    if (analysis.nullMeta > 0) {
      const nullPercentage = ((analysis.nullMeta / analysis.total) * 100).toFixed(2);
      console.log(`\n\x1b[33m%s\x1b[0m`, `⚠️ ${analysis.nullMeta} bookings (${nullPercentage}%) have null wp_meta values.`);
      console.log('If these are expected to have metadata, you might want to investigate why they are null.');
    }
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeBookingData(); 
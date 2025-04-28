#!/usr/bin/env node

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');

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

// Function to find and export problematic wp_meta entries
async function exportProblematicWpMeta() {
  console.log('\x1b[36m%s\x1b[0m', '🔍 Finding bookings with problematic wp_meta...');
  
  try {
    // Get all bookings with non-null wp_meta
    console.log('Fetching bookings with wp_meta...');
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, wp_id, customer_id, wp_meta, created_at')
      .not('wp_meta', 'is', null);
    
    if (error) {
      throw new Error(`Error fetching bookings: ${error.message}`);
    }
    
    console.log(`Found ${bookings.length} bookings with non-null wp_meta`);
    
    // Process and filter problematic entries
    const problematicBookings = [];
    
    for (const booking of bookings) {
      const metaType = typeof booking.wp_meta;
      let isProblematic = false;
      let issue = '';
      
      if (metaType === 'string') {
        if (booking.wp_meta.trim() === '') {
          isProblematic = true;
          issue = 'Empty string';
        } else {
          try {
            // Try to parse the JSON string
            JSON.parse(booking.wp_meta);
            // Not problematic - parsable JSON string
          } catch (e) {
            isProblematic = true;
            issue = 'Unparsable JSON string';
          }
        }
      } else if (metaType !== 'object') {
        isProblematic = true;
        issue = `Unexpected type: ${metaType}`;
      }
      
      if (isProblematic) {
        problematicBookings.push({
          id: booking.id,
          wp_id: booking.wp_id,
          customer_id: booking.customer_id,
          created_at: booking.created_at,
          wp_meta: booking.wp_meta,
          issue
        });
      }
    }
    
    if (problematicBookings.length === 0) {
      console.log('\x1b[32m%s\x1b[0m', '✅ No problematic wp_meta entries found!');
      return;
    }
    
    console.log(`\x1b[33m%s\x1b[0m`, `⚠️ Found ${problematicBookings.length} bookings with problematic wp_meta`);
    
    // Create CSV file with problematic entries
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `problematic_wp_meta_${timestamp}.csv`;
    const outputDir = path.join(process.cwd(), 'exports');
    
    // Create exports directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, filename);
    
    // Create CSV header
    const csvHeader = 'id,wp_id,customer_id,created_at,issue,wp_meta\n';
    fs.writeFileSync(outputPath, csvHeader);
    
    // Add each problematic booking to the CSV
    for (const booking of problematicBookings) {
      // Sanitize wp_meta for CSV format (replace commas, quotes, newlines)
      let sanitizedMeta = '';
      
      if (typeof booking.wp_meta === 'string') {
        sanitizedMeta = booking.wp_meta
          .replace(/"/g, '""') // Escape double quotes
          .replace(/\r?\n|\r/g, ' '); // Replace newlines with spaces
      } else {
        sanitizedMeta = JSON.stringify(booking.wp_meta)
          .replace(/"/g, '""');
      }
      
      // Format the CSV line
      const csvLine = [
        booking.id,
        booking.wp_id,
        booking.customer_id,
        booking.created_at,
        booking.issue.replace(/,/g, ';'), // Replace commas in issue description
        `"${sanitizedMeta}"` // Always quote the wp_meta field
      ].join(',');
      
      fs.appendFileSync(outputPath, csvLine + '\n');
    }
    
    console.log('\x1b[32m%s\x1b[0m', `✅ Exported ${problematicBookings.length} problematic entries to: ${outputPath}`);
    
    // Provide summary by issue type
    const issueTypes = {};
    problematicBookings.forEach(booking => {
      issueTypes[booking.issue] = (issueTypes[booking.issue] || 0) + 1;
    });
    
    console.log('\n\x1b[36m%s\x1b[0m', '📊 Issues Summary:');
    Object.entries(issueTypes).forEach(([issue, count]) => {
      console.log(`  - ${issue}: ${count} bookings`);
    });
    
    // Provide next steps
    console.log('\n\x1b[36m%s\x1b[0m', '🛠 Next Steps:');
    console.log('1. Review the exported CSV file');
    console.log('2. For parsable entries, use the standardize-booking-meta.js script');
    console.log('3. For unparsable entries, consider manual fixes or data cleanup');
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting wp_meta problem export tool');
  await exportProblematicWpMeta();
  console.log('\n\x1b[32m%s\x1b[0m', '✅ Process complete!');
}

main(); 
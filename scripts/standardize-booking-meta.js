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

// Command line argument for dry run
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

async function standardizeWpMeta() {
  console.log('\x1b[36m%s\x1b[0m', '🔄 Starting wp_meta standardization process...');
  
  if (isDryRun) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ DRY RUN MODE: No changes will be made to the database');
  }
  
  try {
    // Get bookings with string wp_meta
    console.log('Fetching bookings with string wp_meta...');
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, wp_id, wp_meta')
      .not('wp_meta', 'is', null);
    
    if (error) {
      throw new Error(`Error fetching bookings: ${error.message}`);
    }
    
    console.log(`Found ${bookings.length} bookings with non-null wp_meta`);
    
    // Process stats
    const stats = {
      total: bookings.length,
      string: 0,
      object: 0,
      parsableStrings: 0,
      unparsableStrings: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      emptyStrings: 0,
      emptyObjects: 0
    };
    
    // Process each booking
    for (const booking of bookings) {
      const metaType = typeof booking.wp_meta;
      
      if (metaType === 'object') {
        stats.object++;
        
        if (Object.keys(booking.wp_meta).length === 0) {
          stats.emptyObjects++;
          console.log(`\x1b[33m%s\x1b[0m`, `⚠️ Booking ${booking.id} (wp_id: ${booking.wp_id}) has an empty object for wp_meta`);
        }
        
        stats.skipped++;
        continue; // Already an object, no conversion needed
      }
      
      if (metaType === 'string') {
        stats.string++;
        
        if (booking.wp_meta.trim() === '') {
          stats.emptyStrings++;
          console.log(`\x1b[33m%s\x1b[0m`, `⚠️ Booking ${booking.id} (wp_id: ${booking.wp_id}) has an empty string for wp_meta`);
          
          // Convert empty string to empty object
          if (!isDryRun) {
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ wp_meta: {} })
              .eq('id', booking.id);
            
            if (updateError) {
              console.error(`\x1b[31m%s\x1b[0m`, `❌ Failed to update booking ${booking.id}: ${updateError.message}`);
              stats.failed++;
            } else {
              console.log(`\x1b[32m%s\x1b[0m`, `✅ Converted empty string to empty object for booking ${booking.id}`);
              stats.updated++;
            }
          } else {
            console.log(`\x1b[33m%s\x1b[0m`, `[DRY RUN] Would convert empty string to empty object for booking ${booking.id}`);
          }
          
          continue;
        }
        
        try {
          // Try to parse the JSON string
          const parsedMeta = JSON.parse(booking.wp_meta);
          stats.parsableStrings++;
          
          // Update the booking with the parsed object
          if (!isDryRun) {
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ wp_meta: parsedMeta })
              .eq('id', booking.id);
            
            if (updateError) {
              console.error(`\x1b[31m%s\x1b[0m`, `❌ Failed to update booking ${booking.id}: ${updateError.message}`);
              stats.failed++;
            } else {
              console.log(`\x1b[32m%s\x1b[0m`, `✅ Converted string to object for booking ${booking.id}`);
              stats.updated++;
            }
          } else {
            console.log(`\x1b[33m%s\x1b[0m`, `[DRY RUN] Would convert string to object for booking ${booking.id}`);
          }
        } catch (e) {
          stats.unparsableStrings++;
          console.error(`\x1b[31m%s\x1b[0m`, `❌ Booking ${booking.id} (wp_id: ${booking.wp_id}) has unparsable JSON: ${booking.wp_meta.substring(0, 100)}${booking.wp_meta.length > 100 ? '...' : ''}`);
          stats.failed++;
        }
      } else {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ Booking ${booking.id} (wp_id: ${booking.wp_id}) has unexpected wp_meta type: ${metaType}`);
        stats.failed++;
      }
      
      // Add a small delay to avoid rate limiting
      if (!isDryRun) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Print final stats
    console.log('\n\x1b[36m%s\x1b[0m', '📊 Standardization Results:');
    console.log('\x1b[33m%s\x1b[0m', '----------------------------------------');
    console.log(`Total bookings processed: ${stats.total}`);
    console.log(`Original format distribution:`);
    console.log(`  - Object format: ${stats.object} (${((stats.object / stats.total) * 100).toFixed(2)}%)`);
    console.log(`  - String format: ${stats.string} (${((stats.string / stats.total) * 100).toFixed(2)}%)`);
    console.log(`    - Parsable JSON strings: ${stats.parsableStrings}`);
    console.log(`    - Unparsable strings: ${stats.unparsableStrings}`);
    console.log(`    - Empty strings: ${stats.emptyStrings}`);
    console.log(`  - Empty objects: ${stats.emptyObjects}`);
    console.log('\nProcessing summary:');
    
    if (isDryRun) {
      console.log(`  - Would update: ${stats.parsableStrings + stats.emptyStrings}`);
      console.log(`  - Would skip (already objects): ${stats.skipped}`);
      console.log(`  - Would fail: ${stats.failed}`);
    } else {
      console.log(`  - Updated: ${stats.updated}`);
      console.log(`  - Skipped (already objects): ${stats.skipped}`);
      console.log(`  - Failed: ${stats.failed}`);
    }
    
    console.log('\x1b[33m%s\x1b[0m', '----------------------------------------');
    
    // Recommendations
    console.log('\n\x1b[36m%s\x1b[0m', '🛠 Next Steps:');
    
    if (stats.unparsableStrings > 0) {
      console.log('\x1b[31m%s\x1b[0m', `❌ ${stats.unparsableStrings} bookings have unparsable wp_meta strings.`);
      console.log('These will need manual review and correction. Consider creating a CSV export of these records.');
    }
    
    if (isDryRun) {
      console.log('\n\x1b[32m%s\x1b[0m', '✅ Dry run completed. To apply changes, run without the --dry-run flag:');
      console.log('node scripts/standardize-booking-meta.js');
    } else if (stats.updated > 0) {
      console.log('\n\x1b[32m%s\x1b[0m', `✅ Successfully standardized ${stats.updated} bookings.`);
    }
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error:', error.message);
    process.exit(1);
  }
}

// Create a backup before making changes
async function createBackup() {
  if (isDryRun) {
    console.log('\x1b[33m%s\x1b[0m', '[DRY RUN] Would create backup of bookings table (skipped)');
    return;
  }
  
  console.log('\x1b[36m%s\x1b[0m', '📦 Creating backup of bookings table...');
  
  try {
    // Create a timestamped backup table
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const backupTableName = `bookings_backup_${timestamp}`;
    
    // Create the backup table
    const { error: createError } = await supabase.rpc('create_table_backup', { 
      source_table: 'bookings',
      target_table: backupTableName
    });
    
    if (createError) {
      // If RPC fails, try a different approach
      console.log('RPC failed, trying direct SQL approach...');
      
      // Get the service role client if available (needed for schema operations)
      const adminSupabase = supabase;
      
      // Try to create backup with direct SQL
      const { error: sqlError } = await adminSupabase.from('bookings')
        .select('*')
        .then(async ({ data, error }) => {
          if (error) return { error };
          
          // Insert the data into the new backup table
          const { error: insertError } = await adminSupabase
            .from(backupTableName)
            .insert(data);
          
          return { error: insertError };
        });
      
      if (sqlError) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Failed to create backup: ${sqlError.message}`);
        console.log('\x1b[33m%s\x1b[0m', '⚠️ Proceeding without backup. Use with caution!');
        
        // Prompt for confirmation
        if (!process.env.CI) {
          console.log('\nDo you want to continue without a backup? (y/N)');
          
          const response = await new Promise(resolve => {
            process.stdin.once('data', data => {
              resolve(data.toString().trim().toLowerCase());
            });
          });
          
          if (response !== 'y') {
            console.log('Operation cancelled. Exiting...');
            process.exit(0);
          }
        }
      } else {
        console.log(`\x1b[32m%s\x1b[0m`, `✅ Backup created successfully as table: ${backupTableName}`);
      }
    } else {
      console.log(`\x1b[32m%s\x1b[0m`, `✅ Backup created successfully as table: ${backupTableName}`);
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Backup creation failed:', error.message);
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Proceeding without backup. Use with caution!');
  }
}

// Main execution
async function main() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting booking wp_meta standardization tool');
  console.log('\x1b[33m%s\x1b[0m', `Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
  
  // Create backup first
  await createBackup();
  
  // Then standardize wp_meta
  await standardizeWpMeta();
  
  console.log('\n\x1b[32m%s\x1b[0m', '✅ Process complete!');
}

main(); 
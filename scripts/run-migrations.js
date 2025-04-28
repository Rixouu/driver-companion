#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory containing the migrations
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

// Check if the directory exists
if (!fs.existsSync(migrationsDir)) {
  console.error('Migrations directory not found:', migrationsDir);
  process.exit(1);
}

// Get all SQL files in the migrations directory
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort alphabetically

if (migrationFiles.length === 0) {
  console.error('No migration files found in', migrationsDir);
  process.exit(1);
}

console.log(`Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(file => console.log(` - ${file}`));

// Function to run a migration
async function runMigration(file) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Get Supabase URL and service role key from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log(`Running migration: ${file}`);
  
  // Use psql to run the migration
  // We'll use the PGSQL_CONN_STRING from Supabase dashboard Project Settings -> Database
  const connectionString = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
  
  return new Promise((resolve, reject) => {
    const child = spawn('psql', [connectionString], {
      env: { ...process.env },
      stdio: ['pipe', 'inherit', 'inherit']
    });
    
    child.stdin.write(sql);
    child.stdin.end();
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Migration ${file} completed successfully`);
        resolve();
      } else {
        console.error(`❌ Migration ${file} failed with code ${code}`);
        reject(new Error(`Migration failed with code ${code}`));
      }
    });
  });
}

// Run migrations sequentially
async function runMigrations() {
  for (const file of migrationFiles) {
    try {
      await runMigration(file);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully!');
}

runMigrations().catch(err => {
  console.error('Error running migrations:', err);
  process.exit(1);
}); 
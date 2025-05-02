# Fix for Vehicle Capacity Column Issue

The booking sync is failing because the database is missing some columns that are being referenced in the code. 

## Option 1: Run this in the Supabase SQL Editor

Log into your Supabase dashboard, navigate to the SQL editor, and run the following SQL:

```sql
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
```

## Option 2: Run using Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db execute --file=run-vehicle-migration.sql
```

## Option 3: Connect directly to the database

If you have direct access to the database:

```bash
psql "your_connection_string" -f run-vehicle-migration.sql
```

## After Adding the Columns

Once the columns have been added to the database, you should be able to run the synchronization process without any errors related to missing columns.

Run the sync process again with:

```bash
npm run sync-bookings
``` 
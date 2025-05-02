-- Add wp_vehicle_id column to store non-UUID vehicle IDs from WordPress
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS wp_vehicle_id TEXT;

-- Set vehicle_id to NULL for all rows that have invalid UUIDs
-- This allows us to keep the data in wp_vehicle_id but prevents insert/update errors
UPDATE bookings SET vehicle_id = NULL WHERE vehicle_id IS NOT NULL AND NOT (vehicle_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'); 
-- Fix Manual Schema Scripts Migration
-- This migration consolidates the manual SQL scripts that were in package.json
-- into proper versioned migration files

-- Add vehicle fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_make TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_capacity INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_year TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add WordPress vehicle ID field
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS wp_vehicle_id TEXT;

-- Fix vehicle_id format validation
-- This ensures vehicle_id follows UUID format or is NULL
UPDATE bookings 
SET vehicle_id = NULL 
WHERE vehicle_id IS NOT NULL 
  AND NOT (vehicle_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Add comments for documentation
COMMENT ON COLUMN bookings.vehicle_make IS 'Vehicle make/manufacturer';
COMMENT ON COLUMN bookings.vehicle_model IS 'Vehicle model name';
COMMENT ON COLUMN bookings.vehicle_capacity IS 'Vehicle passenger capacity';
COMMENT ON COLUMN bookings.vehicle_year IS 'Vehicle manufacturing year';
COMMENT ON COLUMN bookings.service_type IS 'Type of service (airport_transfer, charter, etc.)';
COMMENT ON COLUMN bookings.wp_vehicle_id IS 'WordPress vehicle ID for integration';

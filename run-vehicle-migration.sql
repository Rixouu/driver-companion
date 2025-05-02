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
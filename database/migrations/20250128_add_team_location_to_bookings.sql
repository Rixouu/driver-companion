-- Add team_location column to bookings table
-- This migration adds the team_location column for tracking which team (Japan/Thailand) created the booking

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS team_location VARCHAR(20) DEFAULT 'thailand';

-- Add check constraint to ensure only valid team locations
ALTER TABLE bookings 
ADD CONSTRAINT check_team_location 
CHECK (team_location IN ('japan', 'thailand'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_team_location 
ON bookings(team_location);

-- Update existing bookings to have default team location
UPDATE bookings 
SET team_location = 'thailand' 
WHERE team_location IS NULL;

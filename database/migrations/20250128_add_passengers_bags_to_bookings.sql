-- Add number_of_passengers and number_of_bags columns to bookings table
-- This migration adds fields for smart vehicle filtering based on passenger and luggage requirements

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS number_of_passengers INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS number_of_bags INTEGER DEFAULT NULL;

-- Add indexes for better query performance on filtering
CREATE INDEX IF NOT EXISTS idx_bookings_number_of_passengers 
ON bookings(number_of_passengers) 
WHERE number_of_passengers IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_number_of_bags 
ON bookings(number_of_bags) 
WHERE number_of_bags IS NOT NULL;

-- Add check constraints to ensure valid values
ALTER TABLE bookings 
ADD CONSTRAINT check_number_of_passengers 
CHECK (number_of_passengers IS NULL OR number_of_passengers > 0);

ALTER TABLE bookings 
ADD CONSTRAINT check_number_of_bags 
CHECK (number_of_bags IS NULL OR number_of_bags >= 0);

-- Add comments for documentation
COMMENT ON COLUMN bookings.number_of_passengers IS 'Number of passengers for this booking - used for smart vehicle filtering';
COMMENT ON COLUMN bookings.number_of_bags IS 'Number of bags/luggage for this booking - used for smart vehicle filtering';

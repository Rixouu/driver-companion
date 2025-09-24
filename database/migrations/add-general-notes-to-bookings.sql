-- Add general_notes field to bookings table
ALTER TABLE bookings 
ADD COLUMN general_notes TEXT;

-- Add comment to describe the field
COMMENT ON COLUMN bookings.general_notes IS 'General notes from quotation that are visible to both customer and merchant';

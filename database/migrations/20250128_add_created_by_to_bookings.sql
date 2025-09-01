-- Drop the foreign key constraint if it exists
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_created_by_fkey' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_created_by_fkey;
    END IF;
END $$;

-- Add created_by field to bookings table (without foreign key constraint)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add comment to explain the field
COMMENT ON COLUMN bookings.created_by IS 'UUID of the user who created this booking. For converted quotations, this matches the quotation created_by. For direct bookings, this is the current user session.';

-- Update existing bookings that were converted from quotations
UPDATE bookings 
SET created_by = (
  SELECT created_by 
  FROM quotations 
  WHERE quotations.id = (bookings.meta->>'quotation_id')::uuid
)
WHERE meta->>'quotation_id' IS NOT NULL 
AND created_by IS NULL;

-- Fix dispatch_entries status constraint to allow all valid statuses
-- Run this in your Supabase SQL editor

-- Drop the old constraint
ALTER TABLE dispatch_entries 
DROP CONSTRAINT IF EXISTS dispatch_entries_status_check;

-- Add the new constraint with all valid statuses
ALTER TABLE dispatch_entries 
ADD CONSTRAINT dispatch_entries_status_check 
CHECK (status IN (
  'pending', 
  'assigned', 
  'confirmed', 
  'en_route', 
  'arrived', 
  'in_progress', 
  'completed', 
  'cancelled'
));

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conname = 'dispatch_entries_status_check'; 
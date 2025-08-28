-- Fix the foreign key constraint on bookings.customer_id to reference customers table instead of auth.users
-- This migration fixes the issue where quotations can't be converted to bookings due to wrong foreign key reference

-- Drop the existing foreign key constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

-- Add the correct foreign key constraint to reference the customers table
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Add a comment to document the change
COMMENT ON CONSTRAINT bookings_customer_id_fkey ON bookings IS 'References customers table instead of auth.users for proper quotation conversion';

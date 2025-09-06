-- Add base_amount column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS base_amount NUMERIC DEFAULT NULL;

COMMENT ON COLUMN bookings.base_amount IS 'Base amount before discounts and taxes';

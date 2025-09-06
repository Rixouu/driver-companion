-- Add tax and discount fields to bookings table
-- This migration adds the tax_percentage and discount_percentage columns to match quotation system

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_tax_percentage 
ON bookings(tax_percentage) 
WHERE tax_percentage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_discount_percentage 
ON bookings(discount_percentage) 
WHERE discount_percentage IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bookings.tax_percentage IS 'Tax percentage applied to the booking (default 10% for Japan)';
COMMENT ON COLUMN bookings.discount_percentage IS 'Discount percentage applied to the booking';

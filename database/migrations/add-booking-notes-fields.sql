-- Add customer_notes and merchant_notes fields to bookings table
ALTER TABLE bookings 
ADD COLUMN customer_notes TEXT,
ADD COLUMN merchant_notes TEXT;

-- Add comments to describe the fields
COMMENT ON COLUMN bookings.customer_notes IS 'Customer requirements, special instructions, or notes from quotation';
COMMENT ON COLUMN bookings.merchant_notes IS 'Internal notes, driver instructions, or administrative notes from quotation';

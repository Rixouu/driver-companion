-- Add missing payment link fields to bookings table
-- This migration adds the payment_link_expires_at and payment_link_generated_at columns

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_link_generated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_link_expires_at 
ON bookings(payment_link_expires_at) 
WHERE payment_link_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_link_generated_at 
ON bookings(payment_link_generated_at) 
WHERE payment_link_generated_at IS NOT NULL;

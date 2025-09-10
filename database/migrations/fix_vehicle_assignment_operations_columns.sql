-- Fix missing columns in vehicle_assignment_operations table
ALTER TABLE vehicle_assignment_operations 
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC;

-- Add payment fields to quotations table
-- This migration adds fields to track payment information and receipt uploads

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotations_payment_amount ON quotations(payment_amount);
CREATE INDEX IF NOT EXISTS idx_quotations_payment_method ON quotations(payment_method);
CREATE INDEX IF NOT EXISTS idx_quotations_payment_date ON quotations(payment_date);

-- Add comments for documentation
COMMENT ON COLUMN quotations.payment_amount IS 'Amount paid for the quotation';
COMMENT ON COLUMN quotations.payment_method IS 'Method used for payment (e.g., Credit Card, Bank Transfer)';
COMMENT ON COLUMN quotations.payment_date IS 'Date when payment was received';
COMMENT ON COLUMN quotations.receipt_url IS 'URL to the uploaded receipt file';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
AND column_name IN ('payment_amount', 'payment_method', 'payment_date', 'receipt_url')
ORDER BY column_name;

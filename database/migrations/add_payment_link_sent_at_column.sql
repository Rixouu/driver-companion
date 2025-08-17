-- Add payment_link_sent_at column to quotations table
-- This column tracks when a payment link was sent to the customer

ALTER TABLE quotations 
ADD COLUMN payment_link_sent_at TIMESTAMP WITH TIME ZONE;

-- Add comment to document the column purpose
COMMENT ON COLUMN quotations.payment_link_sent_at IS 'Timestamp when payment link was sent to customer';

-- Create index for better query performance
CREATE INDEX idx_quotations_payment_link_sent_at ON quotations(payment_link_sent_at);

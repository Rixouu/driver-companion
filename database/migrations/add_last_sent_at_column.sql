-- Add last_sent_at column to quotations table
-- This column tracks when the last email was sent to the customer

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE;

-- Add comment to document the column purpose
COMMENT ON COLUMN quotations.last_sent_at IS 'Timestamp when the last email was sent to customer';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quotations_last_sent_at ON quotations(last_sent_at) WHERE last_sent_at IS NOT NULL;

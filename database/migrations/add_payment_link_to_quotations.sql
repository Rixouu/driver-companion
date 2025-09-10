-- Add payment_link field to quotations table
-- This field stores the Omise payment link URL for checking payment status

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS payment_link TEXT,
ADD COLUMN IF NOT EXISTS payment_link_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS charge_id TEXT,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotations_payment_link ON quotations(payment_link) WHERE payment_link IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_charge_id ON quotations(charge_id) WHERE charge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_payment_completed_at ON quotations(payment_completed_at) WHERE payment_completed_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN quotations.payment_link IS 'Omise payment link URL for customer payment';
COMMENT ON COLUMN quotations.payment_link_generated_at IS 'Timestamp when payment link was generated';
COMMENT ON COLUMN quotations.payment_link_expires_at IS 'Timestamp when payment link expires';
COMMENT ON COLUMN quotations.charge_id IS 'Omise charge ID for payment tracking and receipt retrieval';
COMMENT ON COLUMN quotations.payment_completed_at IS 'Timestamp when payment was completed';

-- Add signature fields to quotations table
-- Run this migration to support signature data in quotations

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS approval_signature text,
ADD COLUMN IF NOT EXISTS rejection_signature text,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotations_approved_by ON quotations(approved_by);
CREATE INDEX IF NOT EXISTS idx_quotations_rejected_by ON quotations(rejected_by);
CREATE INDEX IF NOT EXISTS idx_quotations_approved_at ON quotations(approved_at);
CREATE INDEX IF NOT EXISTS idx_quotations_rejected_at ON quotations(rejected_at);

-- Add comments for documentation
COMMENT ON COLUMN quotations.approval_signature IS 'Base64 encoded signature image for approval';
COMMENT ON COLUMN quotations.rejection_signature IS 'Base64 encoded signature image for rejection';
COMMENT ON COLUMN quotations.approved_by IS 'User ID who approved the quotation';
COMMENT ON COLUMN quotations.rejected_by IS 'User ID who rejected the quotation';
COMMENT ON COLUMN quotations.approved_at IS 'Timestamp when quotation was approved';
COMMENT ON COLUMN quotations.rejected_at IS 'Timestamp when quotation was rejected';

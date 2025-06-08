-- Add package and promotion fields to quotations table
-- Run this migration to support package and promotion data in quotations

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS selected_package_id uuid,
ADD COLUMN IF NOT EXISTS selected_package_name text,
ADD COLUMN IF NOT EXISTS selected_package_description text,
ADD COLUMN IF NOT EXISTS package_discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS selected_promotion_id uuid,
ADD COLUMN IF NOT EXISTS selected_promotion_name text,
ADD COLUMN IF NOT EXISTS selected_promotion_description text,
ADD COLUMN IF NOT EXISTS selected_promotion_code text,
ADD COLUMN IF NOT EXISTS promotion_discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_based_adjustment numeric DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotations_selected_package_id ON quotations(selected_package_id);
CREATE INDEX IF NOT EXISTS idx_quotations_selected_promotion_id ON quotations(selected_promotion_id);

-- Add comments for documentation
COMMENT ON COLUMN quotations.selected_package_id IS 'ID of the selected pricing package';
COMMENT ON COLUMN quotations.selected_package_name IS 'Name of the selected pricing package';
COMMENT ON COLUMN quotations.selected_package_description IS 'Description of the selected pricing package';
COMMENT ON COLUMN quotations.package_discount IS 'Discount amount applied from the package';
COMMENT ON COLUMN quotations.selected_promotion_id IS 'ID of the selected promotion';
COMMENT ON COLUMN quotations.selected_promotion_name IS 'Name of the selected promotion';
COMMENT ON COLUMN quotations.selected_promotion_description IS 'Description of the selected promotion';
COMMENT ON COLUMN quotations.selected_promotion_code IS 'Promotion code used';
COMMENT ON COLUMN quotations.promotion_discount IS 'Discount amount applied from the promotion';
COMMENT ON COLUMN quotations.time_based_adjustment IS 'Time-based pricing adjustment amount'; 
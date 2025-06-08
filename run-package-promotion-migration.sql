-- Manual Migration: Add Package and Promotion fields to quotations table
-- Execute this SQL in your Supabase SQL Editor or via psql

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

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
AND table_schema = 'public'
AND column_name IN (
  'selected_package_id', 
  'selected_package_name', 
  'selected_package_description',
  'package_discount',
  'selected_promotion_id',
  'selected_promotion_name', 
  'selected_promotion_description',
  'selected_promotion_code',
  'promotion_discount',
  'time_based_adjustment'
)
ORDER BY column_name; 
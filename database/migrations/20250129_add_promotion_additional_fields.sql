-- Migration: Add additional fields to pricing_promotions table
-- Date: 2025-01-29
-- Description: Add max_uses, min_order_value, and is_featured fields for enhanced promotion functionality

-- Add max_uses field (integer, nullable)
ALTER TABLE pricing_promotions 
ADD COLUMN IF NOT EXISTS max_uses INTEGER;

-- Add min_order_value field (numeric, nullable) 
ALTER TABLE pricing_promotions 
ADD COLUMN IF NOT EXISTS min_order_value NUMERIC;

-- Add is_featured field (boolean, default false)
ALTER TABLE pricing_promotions 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN pricing_promotions.max_uses IS 'Maximum number of times this promotion can be used. NULL means unlimited.';
COMMENT ON COLUMN pricing_promotions.min_order_value IS 'Minimum order value required to use this promotion. NULL means no minimum.';
COMMENT ON COLUMN pricing_promotions.is_featured IS 'Whether this promotion should be highlighted as featured.';

-- Update existing records to have default values
UPDATE pricing_promotions 
SET is_featured = FALSE 
WHERE is_featured IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'pricing_promotions' 
AND column_name IN ('max_uses', 'min_order_value', 'is_featured')
ORDER BY ordinal_position;

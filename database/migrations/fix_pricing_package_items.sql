-- Fix pricing_package_items table by adding missing columns
-- This migration adds the missing columns that the application is trying to use

ALTER TABLE pricing_package_items 
ADD COLUMN IF NOT EXISTS pricing_item_id uuid,
ADD COLUMN IF NOT EXISTS service_type_id text,
ADD COLUMN IF NOT EXISTS vehicle_type text,
ADD COLUMN IF NOT EXISTS price_override decimal(10,2),
ADD COLUMN IF NOT EXISTS is_optional boolean DEFAULT false;

-- Add foreign key constraints
ALTER TABLE pricing_package_items
ADD CONSTRAINT IF NOT EXISTS fk_pricing_item_id 
FOREIGN KEY (pricing_item_id) REFERENCES pricing_items(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_package_items_pricing_item_id 
ON pricing_package_items(pricing_item_id);

CREATE INDEX IF NOT EXISTS idx_pricing_package_items_service_type_id 
ON pricing_package_items(service_type_id);

-- Add comments for documentation
COMMENT ON COLUMN pricing_package_items.pricing_item_id IS 'Reference to pricing_items table';
COMMENT ON COLUMN pricing_package_items.service_type_id IS 'Service type ID associated with this package item';
COMMENT ON COLUMN pricing_package_items.vehicle_type IS 'Vehicle type for this package item';
COMMENT ON COLUMN pricing_package_items.price_override IS 'Override price for this item in the package';
COMMENT ON COLUMN pricing_package_items.is_optional IS 'Whether this item is optional in the package';

-- Update existing records to have sensible defaults
UPDATE pricing_package_items 
SET is_optional = false 
WHERE is_optional IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pricing_package_items' 
AND table_schema = 'public'
ORDER BY ordinal_position; 
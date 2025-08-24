-- Add service_type_ids column to pricing_categories table
-- This allows storing both the service type IDs (for relationships) and names (for display)

ALTER TABLE pricing_categories 
ADD COLUMN IF NOT EXISTS service_type_ids UUID[] DEFAULT '{}';

-- Update existing records to populate service_type_ids based on service_types
-- This is a temporary fix - ideally we'd map the string names to actual service type IDs
UPDATE pricing_categories 
SET service_type_ids = '{}'::UUID[] 
WHERE service_type_ids IS NULL;

-- Add comment to explain the dual storage approach
COMMENT ON COLUMN pricing_categories.service_type_ids IS 'Array of service type UUIDs for proper relationships';
COMMENT ON COLUMN pricing_categories.service_types IS 'Array of service type names for display purposes';

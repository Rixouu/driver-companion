-- Add missing columns to quotation_items table
-- This fixes the PGRST204 error: "Could not find the 'pickup_date' column of 'quotation_items' in the schema cache"

-- Add pickup_date, pickup_time, and time-based adjustment fields to quotation_items table
ALTER TABLE public.quotation_items
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS pickup_time TIME,
ADD COLUMN IF NOT EXISTS time_based_adjustment NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS time_based_rule_name TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotation_items_pickup_date ON public.quotation_items (pickup_date);
CREATE INDEX IF NOT EXISTS idx_quotation_items_pickup_time ON public.quotation_items (pickup_time);

-- Add comments for documentation
COMMENT ON COLUMN public.quotation_items.pickup_date IS 'Pickup date for this service item';
COMMENT ON COLUMN public.quotation_items.pickup_time IS 'Pickup time for this service item';
COMMENT ON COLUMN public.quotation_items.time_based_adjustment IS 'Time-based pricing adjustment percentage';
COMMENT ON COLUMN public.quotation_items.time_based_rule_name IS 'Name of the time-based pricing rule applied';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotation_items' 
AND column_name IN ('pickup_date', 'pickup_time', 'time_based_adjustment', 'time_based_rule_name')
ORDER BY column_name; 
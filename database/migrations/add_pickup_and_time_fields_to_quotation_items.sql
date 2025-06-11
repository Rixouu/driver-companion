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
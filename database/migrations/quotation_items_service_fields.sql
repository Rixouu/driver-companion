-- Add new fields to quotation_items table to support multiple services
ALTER TABLE public.quotation_items
ADD COLUMN IF NOT EXISTS service_type_id UUID,
ADD COLUMN IF NOT EXISTS service_type_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS vehicle_category TEXT,
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS service_days INTEGER,
ADD COLUMN IF NOT EXISTS hours_per_day INTEGER,
ADD COLUMN IF NOT EXISTS is_service_item BOOLEAN DEFAULT false;

-- Optional: Add an index to improve query performance when filtering by is_service_item
CREATE INDEX IF NOT EXISTS idx_quotation_items_is_service ON public.quotation_items (is_service_item);

-- Add foreign key constraint to service_types table if needed
-- ALTER TABLE public.quotation_items
-- ADD CONSTRAINT fk_service_type FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.quotation_items.service_type_id IS 'Reference to service_types table';
COMMENT ON COLUMN public.quotation_items.service_type_name IS 'Name of the service type';
COMMENT ON COLUMN public.quotation_items.vehicle_type IS 'Type of vehicle for this service item';
COMMENT ON COLUMN public.quotation_items.vehicle_category IS 'Category of vehicle for this service item';
COMMENT ON COLUMN public.quotation_items.duration_hours IS 'Duration in hours for this service item';
COMMENT ON COLUMN public.quotation_items.service_days IS 'Number of days for this service item';
COMMENT ON COLUMN public.quotation_items.hours_per_day IS 'Hours per day for charter services';
COMMENT ON COLUMN public.quotation_items.is_service_item IS 'Indicates if this item represents a service configuration'; 
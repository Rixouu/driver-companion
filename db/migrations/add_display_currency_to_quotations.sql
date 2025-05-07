-- Add display_currency column to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS display_currency TEXT;

-- Add comment to the display_currency column
COMMENT ON COLUMN public.quotations.display_currency IS 'Currency selected for display purposes, may be different from the stored currency';

-- Update existing quotations to have the same display_currency as their currency
UPDATE public.quotations
SET display_currency = currency
WHERE display_currency IS NULL; 
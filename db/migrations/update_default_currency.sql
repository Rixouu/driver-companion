-- Update default currency from THB to JPY for all tables

-- Update quotations table
ALTER TABLE public.quotations 
ALTER COLUMN currency SET DEFAULT 'JPY';

-- Add display_currency column if it doesn't exist
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS display_currency TEXT;

-- Update display_currency for all quotations
UPDATE public.quotations
SET display_currency = 'JPY'
WHERE display_currency IS NULL OR display_currency = 'THB';

-- Update pricing_items table
ALTER TABLE public.pricing_items 
ALTER COLUMN currency SET DEFAULT 'JPY';

-- Update existing quotations to use JPY
UPDATE public.quotations
SET currency = 'JPY'
WHERE currency = 'THB';

-- Update existing pricing_items to use JPY
UPDATE public.pricing_items
SET currency = 'JPY'
WHERE currency = 'THB'; 
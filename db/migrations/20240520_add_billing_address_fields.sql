-- Migration to add billing address fields to the bookings table
-- This migration adds columns for storing billing address information synced from WordPress

-- Add billing address fields to the bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS billing_company_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_tax_number TEXT,
  ADD COLUMN IF NOT EXISTS billing_street_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_street_number TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_state TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_country TEXT;

-- Add comment to billing address fields
COMMENT ON COLUMN public.bookings.billing_company_name IS 'Company name for billing';
COMMENT ON COLUMN public.bookings.billing_tax_number IS 'Tax identification number for billing';
COMMENT ON COLUMN public.bookings.billing_street_name IS 'Street name for billing address';
COMMENT ON COLUMN public.bookings.billing_street_number IS 'Street number for billing address';
COMMENT ON COLUMN public.bookings.billing_city IS 'City for billing address';
COMMENT ON COLUMN public.bookings.billing_state IS 'State/Province for billing address';
COMMENT ON COLUMN public.bookings.billing_postal_code IS 'Postal/ZIP code for billing address';
COMMENT ON COLUMN public.bookings.billing_country IS 'Country for billing address';

-- Create an index for searching by company name
CREATE INDEX IF NOT EXISTS idx_bookings_billing_company_name ON public.bookings(billing_company_name); 
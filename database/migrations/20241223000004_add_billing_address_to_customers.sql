-- =============================================================================
-- MIGRATION: Add Billing Address Fields to Customers Table
-- =============================================================================

-- Add billing address fields to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS billing_company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_street_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_street_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_tax_number VARCHAR(100);

-- Create indexes for better performance on billing fields
CREATE INDEX IF NOT EXISTS idx_customers_billing_company ON public.customers(billing_company_name);
CREATE INDEX IF NOT EXISTS idx_customers_billing_city ON public.customers(billing_city);
CREATE INDEX IF NOT EXISTS idx_customers_billing_country ON public.customers(billing_country);

-- Migrate existing billing data from quotations to customers
-- Update customers with billing information from their most recent quotation
UPDATE public.customers c
SET 
  billing_company_name = q.billing_company_name,
  billing_street_number = q.billing_street_number,
  billing_street_name = q.billing_street_name,
  billing_city = q.billing_city,
  billing_state = q.billing_state,
  billing_postal_code = q.billing_postal_code,
  billing_country = q.billing_country,
  billing_tax_number = q.billing_tax_number,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (customer_email)
    customer_email,
    billing_company_name,
    billing_street_number,
    billing_street_name,
    billing_city,
    billing_state,
    billing_postal_code,
    billing_country,
    billing_tax_number
  FROM public.quotations 
  WHERE customer_email IS NOT NULL 
    AND (billing_company_name IS NOT NULL 
         OR billing_street_name IS NOT NULL 
         OR billing_city IS NOT NULL)
  ORDER BY customer_email, created_at DESC
) q
WHERE c.email = q.customer_email
  AND (
    c.billing_company_name IS NULL 
    OR c.billing_street_name IS NULL 
    OR c.billing_city IS NULL
  );

-- Report migration results
DO $$
DECLARE
  updated_count INTEGER;
  total_customers INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM public.customers 
  WHERE billing_company_name IS NOT NULL 
     OR billing_street_name IS NOT NULL 
     OR billing_city IS NOT NULL;
  
  SELECT COUNT(*) INTO total_customers FROM public.customers;
  
  RAISE NOTICE '=== BILLING ADDRESS MIGRATION COMPLETED ===';
  RAISE NOTICE 'Total customers: %', total_customers;
  RAISE NOTICE 'Customers with billing info: %', updated_count;
  RAISE NOTICE 'Migration completed successfully!';
END $$;

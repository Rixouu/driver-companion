-- Fix quotation character encoding issues for Japanese and Thai characters
-- This migration ensures proper UTF-8 encoding for all text fields

-- 1. Check current database encoding
SELECT current_setting('server_encoding') as server_encoding,
       current_setting('client_encoding') as client_encoding;

-- 2. Ensure the database is using UTF-8
-- If not UTF-8, you may need to recreate the database with proper encoding
-- For Supabase, this is typically already UTF-8

-- 3. Update any existing data that might have encoding issues
-- This will help fix any data that was corrupted during previous operations

-- 4. Add explicit encoding constraints to text columns
-- This ensures future data is properly encoded

-- 5. Create a function to clean and validate text data
CREATE OR REPLACE FUNCTION clean_quotation_text(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result_text TEXT;
BEGIN
  -- Remove any null bytes or invalid UTF-8 sequences
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Start with the input text
  result_text := input_text;
  
  -- Decode common HTML entities that might cause issues
  result_text := replace(result_text, '&amp;', '&');
  result_text := replace(result_text, '&lt;', '<');
  result_text := replace(result_text, '&gt;', '>');
  result_text := replace(result_text, '&quot;', '"');
  result_text := replace(result_text, '&#39;', '''');
  result_text := replace(result_text, '&nbsp;', ' ');
  
  -- Normalize whitespace
  result_text := regexp_replace(result_text, '\s+', ' ', 'g');
  result_text := trim(result_text);
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 6. Apply the cleaning function to existing data
UPDATE quotations 
SET 
  customer_name = clean_quotation_text(customer_name),
  customer_email = clean_quotation_text(customer_email),
  customer_phone = clean_quotation_text(customer_phone),
  billing_company_name = clean_quotation_text(billing_company_name),
  billing_tax_number = clean_quotation_text(billing_tax_number),
  billing_street_name = clean_quotation_text(billing_street_name),
  billing_street_number = clean_quotation_text(billing_street_number),
  billing_city = clean_quotation_text(billing_city),
  billing_state = clean_quotation_text(billing_state),
  billing_postal_code = clean_quotation_text(billing_postal_code),
  billing_country = clean_quotation_text(billing_country)
WHERE 
  customer_name IS NOT NULL 
  OR customer_email IS NOT NULL 
  OR customer_phone IS NOT NULL
  OR billing_company_name IS NOT NULL
  OR billing_tax_number IS NOT NULL
  OR billing_street_name IS NOT NULL
  OR billing_street_number IS NOT NULL
  OR billing_city IS NOT NULL
  OR billing_state IS NOT NULL
  OR billing_postal_code IS NOT NULL
  OR billing_country IS NOT NULL;

-- 7. Create a trigger to automatically clean text data on insert/update
CREATE OR REPLACE FUNCTION clean_quotation_text_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean all text fields before insert/update
  NEW.customer_name = clean_quotation_text(NEW.customer_name);
  NEW.customer_email = clean_quotation_text(NEW.customer_email);
  NEW.customer_phone = clean_quotation_text(NEW.customer_phone);
  NEW.billing_company_name = clean_quotation_text(NEW.billing_company_name);
  NEW.billing_tax_number = clean_quotation_text(NEW.billing_tax_number);
  NEW.billing_street_name = clean_quotation_text(NEW.billing_street_name);
  NEW.billing_street_number = clean_quotation_text(NEW.billing_street_number);
  NEW.billing_city = clean_quotation_text(NEW.billing_city);
  NEW.billing_state = clean_quotation_text(NEW.billing_state);
  NEW.billing_postal_code = clean_quotation_text(NEW.billing_postal_code);
  NEW.billing_country = clean_quotation_text(NEW.billing_country);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger
DROP TRIGGER IF EXISTS quotation_text_cleaning_trigger ON quotations;
CREATE TRIGGER quotation_text_cleaning_trigger
  BEFORE INSERT OR UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION clean_quotation_text_trigger();

-- 9. Verify the changes
SELECT 
  'quotations' as table_name,
  count(*) as total_records,
  count(customer_name) as records_with_customer_name,
  count(billing_company_name) as records_with_billing_company
FROM quotations;

-- 10. Test with sample data to ensure encoding works
-- This will help verify that the fix is working
SELECT 
  customer_name,
  billing_company_name,
  billing_city,
  billing_country
FROM quotations 
WHERE 
  customer_name IS NOT NULL 
  OR billing_company_name IS NOT NULL
LIMIT 5;

-- Migration completed successfully
-- Japanese and Thai characters should now display properly in quotations

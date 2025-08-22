-- Simple Character Encoding Fix for Japanese and Thai Characters
-- Run this step by step in Supabase SQL Editor

-- Step 1: Check database encoding
SELECT current_setting('server_encoding') as server_encoding,
       current_setting('client_encoding') as client_encoding;

-- Step 2: Create text cleaning function
CREATE OR REPLACE FUNCTION clean_quotation_text(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result_text TEXT;
BEGIN
  -- Handle null input
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Start with the input text
  result_text := input_text;
  
  -- Decode HTML entities
  result_text := replace(result_text, '&amp;', '&');
  result_text := replace(result_text, '&lt;', '<');
  result_text := replace(result_text, '&gt;', '>');
  result_text := replace(result_text, '&quot;', '"');
  result_text := replace(result_text, '&#39;', '''');
  result_text := replace(result_text, '&nbsp;', ' ');
  
  -- Clean up whitespace and null bytes
  result_text := replace(result_text, E'\x00', '');
  result_text := regexp_replace(result_text, '\s+', ' ', 'g');
  result_text := trim(result_text);
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Test the function
SELECT 
  clean_quotation_text('&amp;Test&amp; &lt;Company&gt;') as test_result,
  clean_quotation_text('株式会社ドライバー・タイランド') as japanese_test,
  clean_quotation_text('บริษัท ไดรเวอร์ ประเทศไทย') as thai_test;

-- Step 4: Apply to existing data (run this carefully)
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

-- Step 5: Create trigger for automatic cleaning
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

-- Step 6: Create the trigger
DROP TRIGGER IF EXISTS quotation_text_cleaning_trigger ON quotations;
CREATE TRIGGER quotation_text_cleaning_trigger
  BEFORE INSERT OR UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION clean_quotation_text_trigger();

-- Step 7: Verify the setup
SELECT 
  'quotations' as table_name,
  count(*) as total_records,
  count(customer_name) as records_with_customer_name,
  count(billing_company_name) as records_with_billing_company
FROM quotations;

-- Migration completed successfully

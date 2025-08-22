-- Minimal Character Encoding Fix for Japanese and Thai Characters
-- This version only handles HTML entity decoding to avoid encoding issues

-- Step 1: Create simple text cleaning function
CREATE OR REPLACE FUNCTION clean_quotation_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Handle null input
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Simply decode HTML entities - no complex operations
  RETURN replace(replace(replace(replace(replace(replace(
    input_text,
    '&amp;', '&'),
    '&lt;', '<'),
    '&gt;', '>'),
    '&quot;', '"'),
    '&#39;', ''''),
    '&nbsp;', ' ');
END;
$$ LANGUAGE plpgsql;

-- Step 2: Test the function with sample data
SELECT 
  clean_quotation_text('&amp;Test&amp; Company &lt;Ltd&gt;') as test_result,
  clean_quotation_text('株式会社ドライバー・タイランド') as japanese_test,
  clean_quotation_text('บริษัท ไดรเวอร์ ประเทศไทย จำกัด') as thai_test;

-- Step 3: Apply to existing quotation data (optional - run carefully)
-- Uncomment the following UPDATE statement if you want to clean existing data:

/*
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
WHERE id IS NOT NULL;
*/

-- Step 4: Create trigger for automatic cleaning (optional)
-- Uncomment if you want automatic cleaning on insert/update:

/*
CREATE OR REPLACE FUNCTION clean_quotation_text_trigger()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS quotation_text_cleaning_trigger ON quotations;
CREATE TRIGGER quotation_text_cleaning_trigger
  BEFORE INSERT OR UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION clean_quotation_text_trigger();
*/

-- Step 5: Verify the function works
SELECT 'Migration completed - function created successfully' as status;


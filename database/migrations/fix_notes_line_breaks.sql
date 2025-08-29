-- Fix Notes Line Breaks - Preserve formatting in customer_notes and merchant_notes
-- This migration fixes the aggressive whitespace normalization that was stripping line breaks

-- Step 1: Create a new function that preserves line breaks in notes fields
CREATE OR REPLACE FUNCTION clean_quotation_text_comprehensive(input_text TEXT, field_name TEXT DEFAULT NULL)
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
  
  -- Step 1: Remove null bytes and invalid characters
  result_text := regexp_replace(result_text, '\0', '', 'g');
  result_text := regexp_replace(result_text, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  
  -- Step 2: Decode HTML entities (common cause of corruption)
  result_text := replace(result_text, '&amp;', '&');
  result_text := replace(result_text, '&lt;', '<');
  result_text := replace(result_text, '&gt;', '>');
  result_text := replace(result_text, '&quot;', '"');
  result_text := replace(result_text, '&#39;', '''');
  result_text := replace(result_text, '&nbsp;', ' ');
  
  -- Step 3: Decode hex HTML entities (simplified approach)
  result_text := regexp_replace(result_text, '&#x[0-9a-fA-F]+;', '', 'g');
  
  -- Step 4: Decode decimal HTML entities (simplified approach)
  result_text := regexp_replace(result_text, '&#\d+;', '', 'g');
  
  -- Step 5: Fix common encoding issues
  result_text := replace(result_text, 'â€™', '''');  -- Common UTF-8 corruption
  result_text := replace(result_text, 'â€œ', '"');   -- Common UTF-8 corruption
  result_text := replace(result_text, 'â€', '"');    -- Common UTF-8 corruption
  result_text := replace(result_text, 'â€"', '—');  -- Common UTF-8 corruption
  result_text := replace(result_text, 'â€¦', '…');  -- Common UTF-8 corruption
  
  -- Step 6: Handle whitespace differently for notes fields vs other fields
  IF field_name IN ('customer_notes', 'merchant_notes') THEN
    -- For notes fields: preserve line breaks, only normalize multiple spaces to single spaces
    -- Replace multiple spaces with single space, but preserve \n and \r
    result_text := regexp_replace(result_text, '[ \t]+', ' ', 'g');
    -- Trim leading/trailing whitespace but preserve line breaks
    result_text := regexp_replace(result_text, '^[ \t]+|[ \t]+$', '', 'g');
  ELSE
    -- For other fields: normalize all whitespace (existing behavior)
    result_text := regexp_replace(result_text, '\s+', ' ', 'g');
    result_text := trim(result_text);
  END IF;
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update the trigger function to pass field names
CREATE OR REPLACE FUNCTION clean_quotation_text_comprehensive_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean all text fields before insert/update
  -- Only clean fields that exist in the table
  IF TG_TABLE_NAME = 'quotations' THEN
    -- Clean quotations table fields
    NEW.customer_name = clean_quotation_text_comprehensive(NEW.customer_name, 'customer_name');
    NEW.customer_email = clean_quotation_text_comprehensive(NEW.customer_email, 'customer_email');
    NEW.customer_phone = clean_quotation_text_comprehensive(NEW.customer_phone, 'customer_phone');
    NEW.billing_company_name = clean_quotation_text_comprehensive(NEW.billing_company_name, 'billing_company_name');
    NEW.billing_tax_number = clean_quotation_text_comprehensive(NEW.billing_tax_number, 'billing_tax_number');
    NEW.billing_street_name = clean_quotation_text_comprehensive(NEW.billing_street_name, 'billing_street_name');
    NEW.billing_street_number = clean_quotation_text_comprehensive(NEW.billing_street_number, 'billing_street_number');
    NEW.billing_city = clean_quotation_text_comprehensive(NEW.billing_city, 'billing_city');
    NEW.billing_state = clean_quotation_text_comprehensive(NEW.billing_state, 'billing_state');
    NEW.billing_postal_code = clean_quotation_text_comprehensive(NEW.billing_postal_code, 'billing_postal_code');
    NEW.billing_country = clean_quotation_text_comprehensive(NEW.billing_country, 'billing_country');
    NEW.customer_notes = clean_quotation_text_comprehensive(NEW.customer_notes, 'customer_notes');
    NEW.merchant_notes = clean_quotation_text_comprehensive(NEW.merchant_notes, 'merchant_notes');
  ELSIF TG_TABLE_NAME = 'quotation_items' THEN
    -- Clean quotation_items table fields (only description exists)
    NEW.description = clean_quotation_text_comprehensive(NEW.description, 'description');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Test the fix with sample data
SELECT 
  'Test Results' as test_type,
  clean_quotation_text_comprehensive('Test Company', 'customer_name') as company_name_test,
  clean_quotation_text_comprehensive('Simon\n〒106-0032東京都港区六本木６−１２−３\n2x suitcases', 'customer_notes') as notes_test;

-- Step 4: Verify the trigger is working
-- The trigger will automatically use the new function for all future inserts/updates

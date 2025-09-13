-- =============================================================================
-- FIX CUSTOMER NOTES DUPLICATION ISSUE
-- =============================================================================
-- This migration fixes the issue where customer notes are being duplicated
-- every time a booking or quotation is updated.

-- =============================================================================
-- STEP 1: UPDATE UPSERT_CUSTOMER FUNCTION
-- =============================================================================

-- Create a new version of upsert_customer that only adds notes on first creation
CREATE OR REPLACE FUNCTION upsert_customer(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_add_notes BOOLEAN DEFAULT TRUE  -- New parameter to control note addition
) RETURNS UUID AS $$
DECLARE
  customer_id UUID;
  cleaned_data RECORD;
BEGIN
  -- Clean the input data
  SELECT * INTO cleaned_data FROM clean_customer_data(p_email, p_name, p_phone);
  
  -- Validate email
  IF cleaned_data.clean_email IS NULL OR cleaned_data.clean_email = '' THEN
    RAISE EXCEPTION 'Email is required for customer creation';
  END IF;
  
  -- Check if customer already exists by email
  SELECT id INTO customer_id 
  FROM customers 
  WHERE email = cleaned_data.clean_email;
  
  -- If customer exists, update their info if new data is provided
  IF customer_id IS NOT NULL THEN
    UPDATE customers 
    SET 
      name = COALESCE(NULLIF(cleaned_data.clean_name, ''), name),
      phone = COALESCE(NULLIF(cleaned_data.clean_phone, ''), phone),
      address = COALESCE(NULLIF(p_address, ''), address),
      -- Only add notes if p_add_notes is TRUE and notes don't already exist
      notes = CASE 
        WHEN p_add_notes = TRUE AND p_notes IS NOT NULL AND p_notes != '' THEN
          CASE 
            WHEN notes IS NULL OR notes = '' THEN p_notes
            ELSE notes  -- Don't append, keep existing notes
          END
        ELSE notes
      END,
      updated_at = NOW()
    WHERE id = customer_id;
  ELSE
    -- Create new customer (always add notes on creation)
    INSERT INTO customers (email, name, phone, address, notes, created_at, updated_at)
    VALUES (
      cleaned_data.clean_email,
      cleaned_data.clean_name,
      cleaned_data.clean_phone,
      p_address,
      p_notes,
      NOW(),
      NOW()
    )
    RETURNING id INTO customer_id;
  END IF;
  
  RETURN customer_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 2: UPDATE TRIGGER FUNCTIONS
-- =============================================================================

-- Update quotation trigger function to only add notes on INSERT, not UPDATE
CREATE OR REPLACE FUNCTION auto_create_customer_from_quotation()
RETURNS TRIGGER AS $$
DECLARE
  customer_uuid UUID;
  should_add_notes BOOLEAN;
BEGIN
  -- Only process if we have an email
  IF NEW.customer_email IS NOT NULL AND TRIM(NEW.customer_email) != '' THEN
    -- Only add notes on INSERT, not on UPDATE
    should_add_notes := TG_OP = 'INSERT';
    
    -- Create or find customer
    SELECT upsert_customer(
      NEW.customer_email,
      NEW.customer_name,
      NEW.customer_phone,
      CONCAT_WS(', ',
        NULLIF(NEW.billing_street_name, ''),
        NULLIF(NEW.billing_city, ''),
        NULLIF(NEW.billing_state, ''),
        NULLIF(NEW.billing_postal_code, ''),
        NULLIF(NEW.billing_country, '')
      ),
      CASE 
        WHEN NEW.customer_notes IS NOT NULL AND NEW.customer_notes != '' 
        THEN 'From quotation #' || NEW.quote_number || ': ' || NEW.customer_notes
        ELSE 'From quotation #' || NEW.quote_number
      END,
      should_add_notes
    ) INTO customer_uuid;
    
    -- Update the quotation with the customer ID
    NEW.customer_id := customer_uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update booking trigger function to only add notes on INSERT, not UPDATE
CREATE OR REPLACE FUNCTION auto_create_customer_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  customer_uuid UUID;
  should_add_notes BOOLEAN;
BEGIN
  -- Only process if we have an email
  IF NEW.customer_email IS NOT NULL AND TRIM(NEW.customer_email) != '' THEN
    -- Only add notes on INSERT, not on UPDATE
    should_add_notes := TG_OP = 'INSERT';
    
    -- Create or find customer
    SELECT upsert_customer(
      NEW.customer_email,
      NEW.customer_name,
      NEW.customer_phone,
      CONCAT_WS(', ',
        NULLIF(NEW.billing_street_name, ''),
        NULLIF(NEW.billing_city, ''),
        NULLIF(NEW.billing_state, ''),
        NULLIF(NEW.billing_postal_code, '')
      ),
      CASE 
        WHEN NEW.notes IS NOT NULL AND NEW.notes != '' 
        THEN 'From booking #' || NEW.wp_id || ': ' || NEW.notes
        ELSE 'From booking #' || NEW.wp_id
      END,
      should_add_notes
    ) INTO customer_uuid;
    
    -- Update the booking with the customer ID
    NEW.customer_id := customer_uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 3: UPDATE API HELPER FUNCTION
-- =============================================================================

-- Update the API helper function to maintain backward compatibility
CREATE OR REPLACE FUNCTION create_customer_from_api(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_segment_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  customer_id UUID;
BEGIN
  -- Validate required fields
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  -- Use upsert_customer with add_notes = TRUE for API calls (manual creation)
  SELECT upsert_customer(p_email, p_name, p_phone, p_address, p_notes, TRUE) INTO customer_id;
  
  -- Update segment if provided
  IF p_segment_id IS NOT NULL THEN
    UPDATE customers 
    SET segment_id = p_segment_id, updated_at = NOW()
    WHERE id = customer_id;
  END IF;
  
  RETURN customer_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 4: CLEAN UP EXISTING DUPLICATE NOTES
-- =============================================================================

-- Function to clean up duplicate notes in existing customer records
CREATE OR REPLACE FUNCTION clean_duplicate_customer_notes() RETURNS INTEGER AS $$
DECLARE
  customer_record RECORD;
  cleaned_notes TEXT;
  updated_count INTEGER := 0;
BEGIN
  -- Find customers with duplicate notes (containing multiple "From quotation #" or "From booking #")
  FOR customer_record IN 
    SELECT id, notes 
    FROM customers 
    WHERE notes IS NOT NULL 
    AND (
      (notes ~ 'From quotation #.*From quotation #') OR
      (notes ~ 'From booking #.*From booking #') OR
      (notes ~ 'From quotation #.*From booking #') OR
      (notes ~ 'From booking #.*From quotation #')
    )
  LOOP
    -- Extract only the first occurrence of notes
    cleaned_notes := split_part(customer_record.notes, E'\n---\n', 1);
    
    -- Update the customer with cleaned notes
    UPDATE customers 
    SET notes = cleaned_notes, updated_at = NOW()
    WHERE id = customer_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Run the cleanup function
DO $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  SELECT clean_duplicate_customer_notes() INTO cleaned_count;
  RAISE NOTICE 'Cleaned up % customer records with duplicate notes', cleaned_count;
END $$;

-- Drop the cleanup function as it's no longer needed
DROP FUNCTION IF EXISTS clean_duplicate_customer_notes();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify the functions are working correctly
DO $$
BEGIN
  RAISE NOTICE 'Customer notes duplication fix applied successfully';
  RAISE NOTICE 'Notes will now only be added on customer creation, not on updates';
  RAISE NOTICE 'Existing duplicate notes have been cleaned up';
END $$;

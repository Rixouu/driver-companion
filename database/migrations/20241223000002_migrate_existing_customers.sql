-- =============================================================================
-- CUSTOMER MIGRATION & AUTO-CREATION SYSTEM
-- =============================================================================
-- This script migrates existing customers from quotations and bookings
-- and sets up automatic customer creation for future records.

-- =============================================================================
-- STEP 1: MIGRATE EXISTING CUSTOMERS
-- =============================================================================

-- First, create a function to clean and normalize customer data
CREATE OR REPLACE FUNCTION clean_customer_data(
  email_input TEXT,
  name_input TEXT,
  phone_input TEXT
) RETURNS TABLE(
  clean_email TEXT,
  clean_name TEXT,
  clean_phone TEXT
) AS $$
BEGIN
  -- Clean and validate email
  clean_email := TRIM(LOWER(COALESCE(email_input, '')));
  
  -- Clean name (remove extra spaces, handle null)
  clean_name := CASE 
    WHEN TRIM(COALESCE(name_input, '')) = '' THEN NULL
    ELSE REGEXP_REPLACE(TRIM(name_input), '\s+', ' ', 'g')
  END;
  
  -- Clean phone (remove extra spaces, standardize format)
  clean_phone := CASE 
    WHEN TRIM(COALESCE(phone_input, '')) = '' THEN NULL
    ELSE REGEXP_REPLACE(TRIM(phone_input), '\s+', ' ', 'g')
  END;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create function to find or create customer
CREATE OR REPLACE FUNCTION upsert_customer(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
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
      notes = CASE 
        WHEN p_notes IS NOT NULL AND p_notes != '' THEN
          CASE 
            WHEN notes IS NULL OR notes = '' THEN p_notes
            ELSE notes || E'\n---\n' || p_notes
          END
        ELSE notes
      END,
      updated_at = NOW()
    WHERE id = customer_id;
  ELSE
    -- Create new customer
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
-- STEP 2: MIGRATE CUSTOMERS FROM QUOTATIONS
-- =============================================================================

-- Migrate unique customers from quotations table
INSERT INTO customers (email, name, phone, created_at, updated_at, notes)
SELECT DISTINCT
  TRIM(LOWER(customer_email)) as email,
  NULLIF(TRIM(customer_name), '') as name,
  NULLIF(TRIM(customer_phone), '') as phone,
  MIN(created_at) as created_at,
  NOW() as updated_at,
  'Migrated from quotations table' as notes
FROM quotations 
WHERE customer_email IS NOT NULL 
  AND TRIM(customer_email) != ''
  AND TRIM(LOWER(customer_email)) NOT IN (SELECT email FROM customers)
GROUP BY TRIM(LOWER(customer_email)), NULLIF(TRIM(customer_name), ''), NULLIF(TRIM(customer_phone), '')
ON CONFLICT (email) DO UPDATE SET
  name = COALESCE(EXCLUDED.name, customers.name),
  phone = COALESCE(EXCLUDED.phone, customers.phone),
  notes = CASE 
    WHEN customers.notes IS NULL OR customers.notes = '' THEN EXCLUDED.notes
    ELSE customers.notes || E'\n' || EXCLUDED.notes
  END,
  updated_at = NOW();

-- =============================================================================
-- STEP 3: MIGRATE CUSTOMERS FROM BOOKINGS
-- =============================================================================

-- Migrate unique customers from bookings table (who aren't already in customers table)
INSERT INTO customers (email, name, phone, created_at, updated_at, notes)
SELECT DISTINCT
  TRIM(LOWER(customer_email)) as email,
  NULLIF(TRIM(customer_name), '') as name,
  NULLIF(TRIM(customer_phone), '') as phone,
  MIN(created_at) as created_at,
  NOW() as updated_at,
  'Migrated from bookings table' as notes
FROM bookings 
WHERE customer_email IS NOT NULL 
  AND TRIM(customer_email) != ''
  AND TRIM(LOWER(customer_email)) NOT IN (SELECT email FROM customers)
GROUP BY TRIM(LOWER(customer_email)), NULLIF(TRIM(customer_name), ''), NULLIF(TRIM(customer_phone), '')
ON CONFLICT (email) DO UPDATE SET
  name = COALESCE(EXCLUDED.name, customers.name),
  phone = COALESCE(EXCLUDED.phone, customers.phone),
  notes = CASE 
    WHEN customers.notes IS NULL OR customers.notes = '' THEN EXCLUDED.notes
    ELSE customers.notes || E'\n' || EXCLUDED.notes
  END,
  updated_at = NOW();

-- =============================================================================
-- STEP 4: UPDATE EXISTING QUOTATIONS TO LINK TO CUSTOMERS
-- =============================================================================

-- Update quotations to reference the customer IDs
UPDATE quotations 
SET customer_id = customers.id
FROM customers 
WHERE quotations.customer_id IS NULL 
  AND TRIM(LOWER(quotations.customer_email)) = customers.email;

-- =============================================================================
-- STEP 5: UPDATE EXISTING BOOKINGS TO LINK TO CUSTOMERS
-- =============================================================================

-- Update bookings to reference the customer IDs
UPDATE bookings 
SET customer_id = customers.id
FROM customers 
WHERE bookings.customer_id IS NULL 
  AND TRIM(LOWER(bookings.customer_email)) = customers.email;

-- =============================================================================
-- STEP 6: CREATE AUTOMATIC CUSTOMER CREATION TRIGGERS
-- =============================================================================

-- Function to automatically create customer when quotation is inserted/updated
CREATE OR REPLACE FUNCTION auto_create_customer_from_quotation()
RETURNS TRIGGER AS $$
DECLARE
  customer_uuid UUID;
BEGIN
  -- Only process if we have an email
  IF NEW.customer_email IS NOT NULL AND TRIM(NEW.customer_email) != '' THEN
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
      END
    ) INTO customer_uuid;
    
    -- Update the quotation with the customer ID
    NEW.customer_id := customer_uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create customer when booking is inserted/updated
CREATE OR REPLACE FUNCTION auto_create_customer_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  customer_uuid UUID;
BEGIN
  -- Only process if we have an email
  IF NEW.customer_email IS NOT NULL AND TRIM(NEW.customer_email) != '' THEN
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
      END
    ) INTO customer_uuid;
    
    -- Update the booking with the customer ID
    NEW.customer_id := customer_uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic customer creation (safe creation)
DO $$
BEGIN
  -- Drop and recreate quotation trigger
  DROP TRIGGER IF EXISTS trigger_auto_create_customer_quotation ON quotations;
  CREATE TRIGGER trigger_auto_create_customer_quotation
    BEFORE INSERT OR UPDATE OF customer_email, customer_name, customer_phone
    ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_from_quotation();

  -- Drop and recreate booking trigger  
  DROP TRIGGER IF EXISTS trigger_auto_create_customer_booking ON bookings;
  CREATE TRIGGER trigger_auto_create_customer_booking
    BEFORE INSERT OR UPDATE OF customer_email, customer_name, customer_phone
    ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_from_booking();
    
  RAISE NOTICE 'Customer creation triggers installed successfully';
END $$;

-- =============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS FOR API USAGE
-- =============================================================================

-- Function to create customer from API (with validation)
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
  
  -- Use upsert_customer and then update segment if provided
  SELECT upsert_customer(p_email, p_name, p_phone, p_address, p_notes) INTO customer_id;
  
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
-- VERIFICATION QUERIES
-- =============================================================================

-- Show migration results
DO $$
DECLARE
  customer_count INTEGER;
  quotation_links INTEGER;
  booking_links INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO quotation_links FROM quotations WHERE customer_id IS NOT NULL;
  SELECT COUNT(*) INTO booking_links FROM bookings WHERE customer_id IS NOT NULL;
  
  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE '- Total customers: %', customer_count;
  RAISE NOTICE '- Quotations linked to customers: %', quotation_links;
  RAISE NOTICE '- Bookings linked to customers: %', booking_links;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upsert_customer(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer_from_api(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clean_customer_data(TEXT, TEXT, TEXT) TO authenticated;

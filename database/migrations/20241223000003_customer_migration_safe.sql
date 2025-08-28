-- =============================================================================
-- SAFE CUSTOMER MIGRATION & AUTO-CREATION SYSTEM
-- =============================================================================
-- This script safely migrates existing customers and sets up automatic creation
-- even if some components already exist.

-- =============================================================================
-- STEP 1: CLEAN UP ANY EXISTING CONFLICTING OBJECTS
-- =============================================================================

-- Drop any existing views that might conflict
DROP VIEW IF EXISTS public.customer_analytics CASCADE;

-- Drop any existing triggers that might conflict
DROP TRIGGER IF EXISTS trigger_auto_create_customer_quotations ON public.quotations;
DROP TRIGGER IF EXISTS trigger_auto_create_customer_bookings ON public.bookings;
DROP TRIGGER IF EXISTS trigger_auto_update_customer_quotations ON public.quotations;
DROP TRIGGER IF EXISTS trigger_auto_update_customer_bookings ON public.bookings;

-- Drop any existing functions that might conflict
DROP FUNCTION IF EXISTS upsert_customer(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_customer_from_api(TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

-- =============================================================================
-- STEP 2: ENSURE CUSTOMER SEGMENTS TABLE EXISTS
-- =============================================================================

-- Create customer segments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'users',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customer_segments_name_unique'
  ) THEN
    ALTER TABLE public.customer_segments 
    ADD CONSTRAINT customer_segments_name_unique UNIQUE (name);
  END IF;
END $$;

-- Add segment_id to customers if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' 
    AND column_name = 'segment_id' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.customers 
    ADD COLUMN segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_customers_segment_id ON public.customers(segment_id);
  END IF;
END $$;

-- Insert default segments safely
DO $$
BEGIN
  -- Insert VIP segment if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.customer_segments WHERE name = 'VIP') THEN
    INSERT INTO public.customer_segments (name, description, color, icon, sort_order) 
    VALUES ('VIP', 'High-value customers with premium service requirements', '#f59e0b', 'crown', 1);
  END IF;

  -- Insert Corporate segment if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.customer_segments WHERE name = 'Corporate') THEN
    INSERT INTO public.customer_segments (name, description, color, icon, sort_order) 
    VALUES ('Corporate', 'Business clients with regular service needs', '#3b82f6', 'building', 2);
  END IF;

  -- Insert Regular segment if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.customer_segments WHERE name = 'Regular') THEN
    INSERT INTO public.customer_segments (name, description, color, icon, sort_order) 
    VALUES ('Regular', 'Standard individual customers', '#6b7280', 'user', 3);
  END IF;

  -- Insert Occasional segment if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.customer_segments WHERE name = 'Occasional') THEN
    INSERT INTO public.customer_segments (name, description, color, icon, sort_order) 
    VALUES ('Occasional', 'Infrequent customers', '#84cc16', 'calendar', 4);
  END IF;

  RAISE NOTICE 'Customer segments created successfully';
END $$;

-- =============================================================================
-- STEP 3: CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Function to clean customer data
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
  clean_email := TRIM(LOWER(COALESCE(email_input, '')));
  clean_name := CASE 
    WHEN TRIM(COALESCE(name_input, '')) = '' THEN NULL
    ELSE REGEXP_REPLACE(TRIM(name_input), '\s+', ' ', 'g')
  END;
  clean_phone := CASE 
    WHEN TRIM(COALESCE(phone_input, '')) = '' THEN NULL
    ELSE REGEXP_REPLACE(TRIM(phone_input), '\s+', ' ', 'g')
  END;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert customer
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
  SELECT * INTO cleaned_data FROM clean_customer_data(p_email, p_name, p_phone);
  
  IF cleaned_data.clean_email IS NULL OR cleaned_data.clean_email = '' THEN
    RAISE EXCEPTION 'Email is required for customer creation';
  END IF;
  
  SELECT id INTO customer_id 
  FROM customers 
  WHERE email = cleaned_data.clean_email;
  
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
-- STEP 4: MIGRATE EXISTING CUSTOMERS FROM QUOTATIONS AND BOOKINGS
-- =============================================================================

-- Migrate from quotations
DO $$
DECLARE
  q_record RECORD;
  new_customer_id UUID;
BEGIN
  FOR q_record IN 
    SELECT DISTINCT
      TRIM(LOWER(customer_email)) as email,
      customer_name as name,
      customer_phone as phone,
      MIN(created_at) as first_seen
    FROM quotations 
    WHERE customer_email IS NOT NULL 
      AND TRIM(customer_email) != ''
    GROUP BY TRIM(LOWER(customer_email)), customer_name, customer_phone
  LOOP
    BEGIN
      SELECT upsert_customer(
        q_record.email,
        q_record.name,
        q_record.phone,
        NULL,
        'Migrated from quotations'
      ) INTO new_customer_id;
      
      -- Update quotations to link to customer
      UPDATE quotations 
      SET customer_id = new_customer_id
      WHERE customer_id IS NULL 
        AND TRIM(LOWER(customer_email)) = q_record.email;
        
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error migrating quotation customer %: %', q_record.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- Migrate from bookings
DO $$
DECLARE
  b_record RECORD;
  new_customer_id UUID;
BEGIN
  FOR b_record IN 
    SELECT DISTINCT
      TRIM(LOWER(customer_email)) as email,
      customer_name as name,
      customer_phone as phone,
      MIN(created_at) as first_seen
    FROM bookings 
    WHERE customer_email IS NOT NULL 
      AND TRIM(customer_email) != ''
    GROUP BY TRIM(LOWER(customer_email)), customer_name, customer_phone
  LOOP
    BEGIN
      SELECT upsert_customer(
        b_record.email,
        b_record.name,
        b_record.phone,
        NULL,
        'Migrated from bookings'
      ) INTO new_customer_id;
      
      -- Update bookings to link to customer
      UPDATE bookings 
      SET customer_id = new_customer_id
      WHERE customer_id IS NULL 
        AND TRIM(LOWER(customer_email)) = b_record.email;
        
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error migrating booking customer %: %', b_record.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 5: CREATE AUTOMATIC CUSTOMER CREATION FUNCTIONS
-- =============================================================================

-- Function for quotations
CREATE OR REPLACE FUNCTION auto_create_customer_from_quotation()
RETURNS TRIGGER AS $$
DECLARE
  customer_uuid UUID;
BEGIN
  IF NEW.customer_email IS NOT NULL AND TRIM(NEW.customer_email) != '' THEN
    BEGIN
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
      
      NEW.customer_id := customer_uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error auto-creating customer for quotation: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for bookings
CREATE OR REPLACE FUNCTION auto_create_customer_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  customer_uuid UUID;
BEGIN
  IF NEW.customer_email IS NOT NULL AND TRIM(NEW.customer_email) != '' THEN
    BEGIN
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
      
      NEW.customer_id := customer_uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error auto-creating customer for booking: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 6: CREATE TRIGGERS SAFELY
-- =============================================================================

DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS trigger_auto_create_customer_quotation ON quotations;
  DROP TRIGGER IF EXISTS trigger_auto_create_customer_booking ON bookings;
  
  -- Create new triggers
  CREATE TRIGGER trigger_auto_create_customer_quotation
    BEFORE INSERT OR UPDATE OF customer_email, customer_name, customer_phone
    ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_from_quotation();

  CREATE TRIGGER trigger_auto_create_customer_booking
    BEFORE INSERT OR UPDATE OF customer_email, customer_name, customer_phone
    ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_from_booking();
    
  RAISE NOTICE 'Customer auto-creation triggers installed successfully';
END $$;

-- =============================================================================
-- STEP 7: CREATE API HELPER FUNCTION
-- =============================================================================

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
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  SELECT upsert_customer(p_email, p_name, p_phone, p_address, p_notes) INTO customer_id;
  
  IF p_segment_id IS NOT NULL THEN
    UPDATE customers 
    SET segment_id = p_segment_id, updated_at = NOW()
    WHERE id = customer_id;
  END IF;
  
  RETURN customer_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 8: CREATE ANALYTICS VIEW
-- =============================================================================

-- Drop existing view to ensure clean recreation
DROP VIEW IF EXISTS public.customer_analytics CASCADE;

-- Create customer analytics view with proper structure
CREATE VIEW public.customer_analytics AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.notes,
  c.created_at,
  c.updated_at,
  c.segment_id,
  cs.name as segment_name,
  cs.description as segment_description,
  cs.color as segment_color,
  cs.icon as segment_icon,
  COALESCE(q_stats.total_quotation_amount, 0) as total_quotation_amount,
  COALESCE(q_stats.quotation_count, 0) as quotation_count,
  COALESCE(b_stats.booking_count, 0) as booking_count,
  GREATEST(
    COALESCE(q_stats.last_quotation_date, c.created_at),
    COALESCE(b_stats.last_booking_date, c.created_at)
  ) as last_activity_date,
  COALESCE(q_stats.total_quotation_amount, 0) as total_spent
FROM public.customers c
LEFT JOIN public.customer_segments cs ON c.segment_id = cs.id
LEFT JOIN (
  SELECT 
    customer_id,
    SUM(COALESCE(payment_amount, amount)) as total_quotation_amount,
    COUNT(*) as quotation_count,
    MAX(created_at) as last_quotation_date
  FROM public.quotations 
  WHERE customer_id IS NOT NULL 
    AND status IN ('approved', 'paid', 'converted')
  GROUP BY customer_id
) q_stats ON c.id = q_stats.customer_id
LEFT JOIN (
  SELECT 
    customer_id,
    COUNT(*) as booking_count,
    MAX(created_at) as last_booking_date
  FROM public.bookings 
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
) b_stats ON c.id = b_stats.customer_id;

-- Grant permissions on the view
GRANT SELECT ON public.customer_analytics TO authenticated;

-- =============================================================================
-- STEP 9: FINAL REPORT
-- =============================================================================

DO $$
DECLARE
  customer_count INTEGER;
  quotation_links INTEGER;
  booking_links INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO quotation_links FROM quotations WHERE customer_id IS NOT NULL;
  SELECT COUNT(*) INTO booking_links FROM bookings WHERE customer_id IS NOT NULL;
  
  RAISE NOTICE '=== CUSTOMER MIGRATION COMPLETED ===';
  RAISE NOTICE 'Total customers created: %', customer_count;
  RAISE NOTICE 'Quotations linked to customers: %', quotation_links;
  RAISE NOTICE 'Bookings linked to customers: %', booking_links;
  RAISE NOTICE '=== AUTOMATIC CUSTOMER CREATION ACTIVE ===';
END $$;

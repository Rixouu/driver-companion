-- =============================================================================
-- MIGRATION: Fix Customer RLS Policies
-- =============================================================================

-- Enable RLS on customers table if not already enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view customer data" ON public.customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;

-- Create comprehensive RLS policies for customers table
CREATE POLICY "Users can view customer data" ON public.customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create customers" ON public.customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customers" ON public.customers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete customers" ON public.customers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Service role policy for admin operations
CREATE POLICY "Service role can manage customers" ON public.customers
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '=== CUSTOMER RLS POLICIES FIXED ===';
  RAISE NOTICE 'View policy: Users can view customer data';
  RAISE NOTICE 'Create policy: Users can create customers';
  RAISE NOTICE 'Update policy: Users can update customers';
  RAISE NOTICE 'Delete policy: Users can delete customers';
  RAISE NOTICE 'Service role policy: Service role can manage customers';
  RAISE NOTICE 'All policies created successfully!';
END $$;

-- =============================================================================
-- MIGRATION: Fix Customer Analytics View and Add Back Address Column
-- =============================================================================

-- Add back the address column that was accidentally deleted
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Drop existing view if it exists
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
  -- Billing address fields
  c.billing_company_name,
  c.billing_street_number,
  c.billing_street_name,
  c.billing_city,
  c.billing_state,
  c.billing_postal_code,
  c.billing_country,
  c.billing_tax_number,
  -- Analytics from quotations
  COALESCE(q_stats.total_quotation_amount, 0) as total_quotation_amount,
  COALESCE(q_stats.quotation_count, 0) as quotation_count,
  -- Analytics from bookings
  COALESCE(b_stats.booking_count, 0) as booking_count,
  -- Last activity date
  GREATEST(
    COALESCE(q_stats.last_quotation_date, c.created_at),
    COALESCE(b_stats.last_booking_date, c.created_at)
  ) as last_activity_date,
  -- Total spent (from quotations)
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

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '=== CUSTOMER ANALYTICS VIEW FIXED ===';
  RAISE NOTICE 'Address column added back to customers table';
  RAISE NOTICE 'Customer analytics view recreated successfully';
  RAISE NOTICE 'All billing address fields are available';
END $$;

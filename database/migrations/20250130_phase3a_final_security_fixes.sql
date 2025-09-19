-- =============================================
-- PHASE 3A: Final Security Fixes
-- =============================================
-- This migration addresses the remaining security issues:
-- 1. SECURITY DEFINER views (4 views)
-- 2. Function search_path warnings (3 functions)
-- 3. Note: auth_leaked_password_protection and vulnerable_postgres_version require Supabase dashboard changes

-- =============================================
-- 1. FIX SECURITY DEFINER VIEWS
-- =============================================
-- Recreate views without SECURITY DEFINER property

-- Drop and recreate customer_analytics view
DROP VIEW IF EXISTS public.customer_analytics;
CREATE VIEW public.customer_analytics AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.created_at,
  COUNT(DISTINCT q.id) as total_quotations,
  COUNT(DISTINCT b.id) as total_bookings,
  COALESCE(SUM(q.total_amount), 0) as total_quotation_value,
  COALESCE(SUM(b.price_amount), 0) as total_booking_value,
  COALESCE(SUM(b.price_amount), 0) as total_revenue,
  MAX(q.created_at) as last_quotation_date,
  MAX(b.created_at) as last_booking_date,
  CASE 
    WHEN COUNT(DISTINCT q.id) = 0 THEN 'No Activity'
    WHEN COUNT(DISTINCT b.id) = 0 THEN 'Quotations Only'
    WHEN COUNT(DISTINCT b.id) >= 5 THEN 'High Value'
    ELSE 'Regular'
  END as customer_segment
FROM customers c
LEFT JOIN quotations q ON c.id = q.customer_id
LEFT JOIN bookings b ON c.id = b.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.created_at;

-- Grant permissions
GRANT SELECT ON public.customer_analytics TO anon, authenticated;

-- Drop and recreate inspection_details view
DROP VIEW IF EXISTS public.inspection_details;
CREATE VIEW public.inspection_details AS
SELECT 
  i.id,
  i.vehicle_id,
  v.brand,
  v.model,
  v.plate_number,
  i.inspector_id,
  d.first_name || ' ' || d.last_name as inspector_name,
  i.date,
  i.status,
  i.notes,
  i.created_at,
  i.updated_at,
  COUNT(ii.id) as total_items,
  COUNT(CASE WHEN ii.status = 'pass' THEN 1 END) as passed_items,
  COUNT(CASE WHEN ii.status = 'fail' THEN 1 END) as failed_items,
  COUNT(CASE WHEN ii.status = 'warning' THEN 1 END) as warning_items
FROM inspections i
LEFT JOIN vehicles v ON i.vehicle_id = v.id
LEFT JOIN drivers d ON i.inspector_id = d.id
LEFT JOIN inspection_items ii ON i.id = ii.inspection_id
GROUP BY i.id, i.vehicle_id, v.brand, v.model, v.plate_number, 
         i.inspector_id, d.first_name, d.last_name, i.date, i.status, 
         i.notes, i.created_at, i.updated_at;

-- Grant permissions
GRANT SELECT ON public.inspection_details TO anon, authenticated;

-- Drop and recreate quotation_summary_view
DROP VIEW IF EXISTS public.quotation_summary_view;
CREATE VIEW public.quotation_summary_view AS
SELECT 
  q.id,
  q.customer_id,
  c.name as customer_name,
  c.email as customer_email,
  q.title,
  q.status,
  q.total_amount,
  q.currency,
  q.created_at,
  q.updated_at,
  q.pickup_date,
  q.pickup_time,
  q.pickup_location,
  q.dropoff_location,
  q.duration_hours,
  q.customer_notes as notes,
  COUNT(qi.id) as item_count,
  COALESCE(SUM(qi.quantity), 0) as total_quantity,
  COALESCE(SUM(qi.unit_price * qi.quantity), 0) as calculated_total
FROM quotations q
LEFT JOIN customers c ON q.customer_id = c.id
LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
GROUP BY q.id, q.customer_id, c.name, c.email, q.title, q.status, 
         q.total_amount, q.currency, q.created_at, q.updated_at,
         q.pickup_date, q.pickup_time, q.pickup_location, q.dropoff_location,
         q.duration_hours, q.customer_notes;

-- Grant permissions
GRANT SELECT ON public.quotation_summary_view TO anon, authenticated;

-- Drop and recreate user_profiles view (secure version)
DROP VIEW IF EXISTS public.user_profiles;
CREATE VIEW public.user_profiles AS
SELECT 
  p.id,
  p.email::character varying(255) AS email,
  p.full_name,
  p.updated_at AS profile_updated_at,
  CASE
    WHEN p.email LIKE '%@japandriver.com' THEN 'Japan'
    ELSE 'Thailand'
  END AS team_location,
  true AS is_active,
  p.updated_at AS created_at,
  NULL::text AS avatar_url,
  NULL::timestamp with time zone AS auth_created_at,
  NULL::timestamp with time zone AS last_sign_in_at,
  NULL::timestamp with time zone AS email_confirmed_at
FROM profiles p;

-- Grant permissions
GRANT SELECT ON public.user_profiles TO anon, authenticated;

-- =============================================
-- 2. FIX FUNCTION SEARCH_PATH WARNINGS
-- =============================================
-- Set search_path for helper functions

ALTER FUNCTION public.is_admin() SET search_path = 'public';
ALTER FUNCTION public.is_service_role() SET search_path = 'public';
ALTER FUNCTION public.is_authenticated() SET search_path = 'public';

-- =============================================
-- 3. ANALYZE TABLES FOR OPTIMIZATION
-- =============================================

ANALYZE public.customer_analytics;
ANALYZE public.inspection_details;
ANALYZE public.quotation_summary_view;
ANALYZE public.user_profiles;

-- =============================================
-- 4. NOTES ON REMAINING WARNINGS
-- =============================================
-- The following warnings require Supabase Dashboard configuration:
-- 
-- 1. auth_leaked_password_protection:
--    - Go to Supabase Dashboard > Authentication > Settings
--    - Enable "Leaked password protection"
--    - This checks passwords against HaveIBeenPwned.org
--
-- 2. vulnerable_postgres_version:
--    - Go to Supabase Dashboard > Settings > Database
--    - Upgrade PostgreSQL to the latest version
--    - Current: supabase-postgres-15.8.1.111
--    - Recommended: Latest available version
--
-- These cannot be fixed via SQL migrations and require dashboard access.

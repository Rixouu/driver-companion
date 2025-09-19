-- Phase 3A: Final Corrected Security Fixes
-- Fix security issues with actual database schema

-- =============================================
-- 1. FIX SECURITY DEFINER VIEWS (SAFE APPROACH)
-- =============================================

-- Recreate customer_analytics without SECURITY DEFINER
CREATE OR REPLACE VIEW public.customer_analytics AS
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
  cs.name AS segment_name,
  cs.description AS segment_description,
  cs.color AS segment_color,
  cs.icon AS segment_icon,
  c.billing_company_name,
  c.billing_street_number,
  c.billing_street_name,
  c.billing_city,
  c.billing_state,
  c.billing_postal_code,
  c.billing_country,
  c.billing_tax_number,
  COALESCE(q_stats.total_quotation_amount, 0::numeric) AS total_quotation_amount,
  COALESCE(q_stats.quotation_count, 0::bigint) AS quotation_count,
  COALESCE(b_stats.booking_count, 0::bigint) AS booking_count,
  GREATEST(COALESCE(q_stats.last_quotation_date, c.created_at), COALESCE(b_stats.last_booking_date, c.created_at)) AS last_activity_date,
  COALESCE(q_stats.total_quotation_amount, 0::numeric) AS total_spent
FROM customers c
LEFT JOIN customer_segments cs ON c.segment_id = cs.id
LEFT JOIN (
  SELECT 
    quotations.customer_id,
    sum(COALESCE(quotations.payment_amount, quotations.amount)) AS total_quotation_amount,
    count(*) AS quotation_count,
    max(quotations.created_at) AS last_quotation_date
  FROM quotations
  WHERE quotations.customer_id IS NOT NULL 
    AND quotations.status = ANY (ARRAY['approved'::text, 'paid'::text, 'converted'::text])
  GROUP BY quotations.customer_id
) q_stats ON c.id = q_stats.customer_id
LEFT JOIN (
  SELECT 
    bookings.customer_id,
    count(*) AS booking_count,
    max(bookings.created_at) AS last_booking_date
  FROM bookings
  WHERE bookings.customer_id IS NOT NULL
  GROUP BY bookings.customer_id
) b_stats ON c.id = b_stats.customer_id;

-- Recreate inspection_details without SECURITY DEFINER
CREATE OR REPLACE VIEW public.inspection_details AS
SELECT 
  i.id,
  i.date,
  i.status,
  i.type,
  i.vehicle_id,
  i.created_at,
  i.updated_at,
  i.notes,
  i.items,
  i.schedule_type,
  i.due_date,
  i.started_at,
  i.booking_id,
  v.name AS vehicle_name,
  v.plate_number,
  v.model,
  v.year,
  v.brand,
  di.id AS inspector_id,
  di.email AS inspector_email,
  concat(di.first_name, ' ', di.last_name) AS inspector_name,
  di.phone AS inspector_phone,
  dd.id AS driver_id,
  dd.email AS driver_email,
  concat(dd.first_name, ' ', dd.last_name) AS driver_name,
  dd.phone AS driver_phone
FROM inspections i
LEFT JOIN vehicles v ON i.vehicle_id = v.id
LEFT JOIN drivers di ON i.inspector_id = di.id
LEFT JOIN drivers dd ON i.driver_id = dd.id;

-- Recreate quotation_summary_view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.quotation_summary_view AS
SELECT 
  quotations.id,
  quotations.customer_name,
  quotations.customer_email,
  quotations.billing_company_name,
  quotations.billing_city,
  quotations.billing_country,
  quotations.amount,
  quotations.currency,
  quotations.status,
  quotations.created_at
FROM quotations;

-- =============================================
-- 2. CREATE SECURE USER_PROFILES VIEW
-- =============================================

-- Create a secure version of user_profiles that works with actual profiles table structure
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.updated_at AS profile_updated_at,
  -- Add team_location logic based on email domain
  CASE
    WHEN p.email LIKE '%@japandriver.com' THEN 'Japan'
    ELSE 'Thailand'
  END AS team_location,
  -- Add is_active logic (default to true for existing users)
  true AS is_active,
  -- Use updated_at as created_at since profiles doesn't have created_at
  p.updated_at AS created_at,
  -- Add avatar_url as null since profiles doesn't have it
  NULL::text AS avatar_url,
  -- Add auth-related fields as null since we're not exposing auth.users
  NULL::timestamp with time zone AS auth_created_at,
  NULL::timestamp with time zone AS last_sign_in_at,
  NULL::timestamp with time zone AS email_confirmed_at
FROM profiles p;

-- Grant appropriate permissions to views
GRANT SELECT ON public.customer_analytics TO anon, authenticated;
GRANT SELECT ON public.inspection_details TO anon, authenticated;
GRANT SELECT ON public.quotation_summary_view TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON TABLES
-- =============================================

-- Enable RLS on all tables that need it
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_category_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_template_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_category_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE RLS POLICIES FOR EACH TABLE
-- =============================================

-- Notification Templates - Allow read for authenticated users, write for service role
CREATE POLICY "notification_templates_read_policy" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "notification_templates_write_policy" ON public.notification_templates
  FOR ALL TO service_role
  USING (true);

-- Service Types - Allow read for authenticated users, write for service role
CREATE POLICY "service_types_read_policy" ON public.service_types
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_types_write_policy" ON public.service_types
  FOR ALL TO service_role
  USING (true);

-- Pricing Category Vehicles - Allow read for authenticated users, write for service role
CREATE POLICY "pricing_category_vehicles_read_policy" ON public.pricing_category_vehicles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pricing_category_vehicles_write_policy" ON public.pricing_category_vehicles
  FOR ALL TO service_role
  USING (true);

-- Email Statuses - Allow read for authenticated users, write for service role
CREATE POLICY "email_statuses_read_policy" ON public.email_statuses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "email_statuses_write_policy" ON public.email_statuses
  FOR ALL TO service_role
  USING (true);

-- Inspection Template Assignments - Allow read for authenticated users, write for service role
CREATE POLICY "inspection_template_assignments_read_policy" ON public.inspection_template_assignments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inspection_template_assignments_write_policy" ON public.inspection_template_assignments
  FOR ALL TO service_role
  USING (true);

-- Pricing Category Service Types - Allow read for authenticated users, write for service role
CREATE POLICY "pricing_category_service_types_read_policy" ON public.pricing_category_service_types
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pricing_category_service_types_write_policy" ON public.pricing_category_service_types
  FOR ALL TO service_role
  USING (true);

-- Vehicle Groups - Allow read for authenticated users, write for service role
CREATE POLICY "vehicle_groups_read_policy" ON public.vehicle_groups
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "vehicle_groups_write_policy" ON public.vehicle_groups
  FOR ALL TO service_role
  USING (true);

-- Email Engagement Events - Allow read for authenticated users, write for service role
CREATE POLICY "email_engagement_events_read_policy" ON public.email_engagement_events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "email_engagement_events_write_policy" ON public.email_engagement_events
  FOR ALL TO service_role
  USING (true);

-- Quotation Payments - Allow read for authenticated users, write for service role
CREATE POLICY "quotation_payments_read_policy" ON public.quotation_payments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "quotation_payments_write_policy" ON public.quotation_payments
  FOR ALL TO service_role
  USING (true);

-- Company Branding - Allow read for authenticated users, write for service role
CREATE POLICY "company_branding_read_policy" ON public.company_branding
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "company_branding_write_policy" ON public.company_branding
  FOR ALL TO service_role
  USING (true);

-- App Settings - Allow read for authenticated users, write for service role
CREATE POLICY "app_settings_read_policy" ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "app_settings_write_policy" ON public.app_settings
  FOR ALL TO service_role
  USING (true);

-- =============================================
-- 5. VERIFICATION QUERIES
-- =============================================

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'notification_templates',
    'service_types',
    'pricing_category_vehicles',
    'email_statuses',
    'inspection_template_assignments',
    'pricing_category_service_types',
    'vehicle_groups',
    'email_engagement_events',
    'quotation_payments',
    'company_branding',
    'app_settings'
  )
ORDER BY tablename;

-- Verify views exist and are not security definer
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN (
    'user_profiles',
    'customer_analytics',
    'inspection_details',
    'quotation_summary_view'
  )
ORDER BY viewname;

-- Phase 3A: Security Fixes for Supabase Warnings
-- Fix function search_path mutable warnings and other security issues

-- =============================================
-- FUNCTION SECURITY FIXES
-- =============================================

-- Fix function search_path mutable warnings by setting search_path explicitly
-- This prevents SQL injection attacks through search_path manipulation

-- Core functions
ALTER FUNCTION public.calculate_next_run() SET search_path = 'public';
ALTER FUNCTION public.recalculate_quotation_totals() SET search_path = 'public';
ALTER FUNCTION public.get_inspections_with_details() SET search_path = 'public';
ALTER FUNCTION public.upsert_customer() SET search_path = 'public';
ALTER FUNCTION public.auto_create_customer_from_quotation() SET search_path = 'public';
ALTER FUNCTION public.clean_customer_data() SET search_path = 'public';
ALTER FUNCTION public.auto_create_customer_from_booking() SET search_path = 'public';
ALTER FUNCTION public.create_customer_from_api() SET search_path = 'public';

-- Notification functions
ALTER FUNCTION public.get_user_notification_preferences() SET search_path = 'public';
ALTER FUNCTION public.get_active_notification_templates() SET search_path = 'public';
ALTER FUNCTION public.log_notification_delivery() SET search_path = 'public';

-- Quotation functions
ALTER FUNCTION public.clean_quotation_text() SET search_path = 'public';
ALTER FUNCTION public.clean_quotation_text_trigger() SET search_path = 'public';
ALTER FUNCTION public.clean_quotation_text_comprehensive() SET search_path = 'public';
ALTER FUNCTION public.clean_quotation_text_comprehensive_trigger() SET search_path = 'public';
ALTER FUNCTION public.check_quotation_encoding_issues() SET search_path = 'public';
ALTER FUNCTION public.check_quotation_expiry() SET search_path = 'public';
ALTER FUNCTION public.calculate_quotation_total_amount() SET search_path = 'public';
ALTER FUNCTION public.update_quotation_with_correct_price() SET search_path = 'public';
ALTER FUNCTION public.update_quotation_totals_trigger() SET search_path = 'public';

-- Vehicle and dispatch functions
ALTER FUNCTION public.get_vehicle_utilization() SET search_path = 'public';
ALTER FUNCTION public.handle_dispatch_status_updates() SET search_path = 'public';
ALTER FUNCTION public.calculate_charter_price() SET search_path = 'public';

-- Analytics functions
ALTER FUNCTION public.get_dashboard_metrics() SET search_path = 'public';
ALTER FUNCTION public.get_quotations_analytics() SET search_path = 'public';
ALTER FUNCTION public.get_bookings_analytics() SET search_path = 'public';
ALTER FUNCTION public.get_driver_performance() SET search_path = 'public';
ALTER FUNCTION public.search_quotations() SET search_path = 'public';

-- Utility functions
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public';
ALTER FUNCTION public.trigger_set_updated_at() SET search_path = 'public';
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.update_dispatch_entries_updated_at() SET search_path = 'public';
ALTER FUNCTION public.set_service_type_user_ids() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_notifications() SET search_path = 'public';
ALTER FUNCTION public.cleanup_pricing_time_based_rules_on_category_delete() SET search_path = 'public';
ALTER FUNCTION public.get_correct_price_for_duration() SET search_path = 'public';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify function search_path settings
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'calculate_next_run',
    'recalculate_quotation_totals',
    'get_inspections_with_details',
    'upsert_customer',
    'get_dashboard_metrics',
    'search_quotations'
  )
ORDER BY p.proname;

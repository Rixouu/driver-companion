-- Phase 3A: Security Fixes for Supabase Warnings (CORRECTED)
-- Fix function search_path mutable warnings - only for functions that actually exist

-- =============================================
-- FUNCTION SECURITY FIXES (EXISTING FUNCTIONS ONLY)
-- =============================================

-- Core functions
ALTER FUNCTION public.calculate_next_run(character varying, integer, integer, time without time zone) SET search_path = 'public';
ALTER FUNCTION public.recalculate_quotation_totals() SET search_path = 'public';
ALTER FUNCTION public.get_inspections_with_details(integer, integer, text, text, timestamp with time zone, timestamp with time zone) SET search_path = 'public';
ALTER FUNCTION public.upsert_customer(text, text, text, text, text) SET search_path = 'public';
ALTER FUNCTION public.upsert_customer(text, text, text, text, text, boolean) SET search_path = 'public';
ALTER FUNCTION public.auto_create_customer_from_quotation() SET search_path = 'public';
ALTER FUNCTION public.clean_customer_data(text, text, text) SET search_path = 'public';
ALTER FUNCTION public.auto_create_customer_from_booking() SET search_path = 'public';
ALTER FUNCTION public.create_customer_from_api(text, text, text, text, text, uuid) SET search_path = 'public';

-- Notification functions
ALTER FUNCTION public.get_user_notification_preferences(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_active_notification_templates(character varying, character varying) SET search_path = 'public';
ALTER FUNCTION public.log_notification_delivery(uuid, uuid, character varying, character varying, character varying, character varying, text, jsonb) SET search_path = 'public';

-- Quotation functions
ALTER FUNCTION public.clean_quotation_text(text) SET search_path = 'public';
ALTER FUNCTION public.clean_quotation_text_trigger() SET search_path = 'public';
ALTER FUNCTION public.clean_quotation_text_comprehensive(text) SET search_path = 'public';
ALTER FUNCTION public.clean_quotation_text_comprehensive(text, text) SET search_path = 'public';
ALTER FUNCTION public.clean_quotation_text_comprehensive_trigger() SET search_path = 'public';
ALTER FUNCTION public.check_quotation_encoding_issues() SET search_path = 'public';
ALTER FUNCTION public.check_quotation_expiry() SET search_path = 'public';
ALTER FUNCTION public.calculate_quotation_total_amount() SET search_path = 'public';
ALTER FUNCTION public.update_quotation_with_correct_price() SET search_path = 'public';
ALTER FUNCTION public.update_quotation_totals_trigger() SET search_path = 'public';

-- Vehicle and dispatch functions
ALTER FUNCTION public.get_vehicle_utilization() SET search_path = 'public';
ALTER FUNCTION public.handle_dispatch_status_updates() SET search_path = 'public';
ALTER FUNCTION public.calculate_charter_price(numeric, integer) SET search_path = 'public';
ALTER FUNCTION public.calculate_charter_price(numeric, integer, uuid) SET search_path = 'public';

-- Analytics functions
ALTER FUNCTION public.get_dashboard_metrics() SET search_path = 'public';
ALTER FUNCTION public.get_quotations_analytics(timestamp with time zone, timestamp with time zone) SET search_path = 'public';
ALTER FUNCTION public.get_bookings_analytics(timestamp with time zone, timestamp with time zone) SET search_path = 'public';
ALTER FUNCTION public.get_driver_performance() SET search_path = 'public';
ALTER FUNCTION public.search_quotations(text, text, text, boolean, integer, integer) SET search_path = 'public';

-- Utility functions
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public';
ALTER FUNCTION public.trigger_set_updated_at() SET search_path = 'public';
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.update_dispatch_entries_updated_at() SET search_path = 'public';
ALTER FUNCTION public.set_service_type_user_ids() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_notifications() SET search_path = 'public';
ALTER FUNCTION public.cleanup_pricing_time_based_rules_on_category_delete() SET search_path = 'public';
ALTER FUNCTION public.get_correct_price_for_duration(text, text, integer) SET search_path = 'public';
ALTER FUNCTION public.get_correct_price_for_duration(text, uuid, integer) SET search_path = 'public';
ALTER FUNCTION public.get_correct_price_for_duration(text, text, integer, uuid) SET search_path = 'public';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify function search_path settings
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
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

-- Phase 3A: Database Performance Optimization - Query Functions
-- This migration creates optimized database functions for common query patterns

-- ==============================================
-- DASHBOARD METRICS OPTIMIZATION
-- ==============================================

-- Function to get dashboard statistics in a single query
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
  total_vehicles bigint,
  active_vehicles bigint,
  vehicles_in_maintenance bigint,
  total_drivers bigint,
  active_drivers bigint,
  drivers_on_duty bigint,
  total_inspections bigint,
  completed_inspections bigint,
  pending_inspections bigint,
  failed_inspections bigint,
  total_maintenance_tasks bigint,
  completed_tasks bigint,
  pending_tasks bigint,
  overdue_tasks bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Vehicle metrics
    (SELECT COUNT(*) FROM vehicles) as total_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE status = 'active') as active_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE status = 'maintenance') as vehicles_in_maintenance,
    
    -- Driver metrics
    (SELECT COUNT(*) FROM drivers) as total_drivers,
    (SELECT COUNT(*) FROM drivers WHERE status = 'active') as active_drivers,
    (SELECT COUNT(*) FROM drivers WHERE status = 'on_duty') as drivers_on_duty,
    
    -- Inspection metrics
    (SELECT COUNT(*) FROM inspections) as total_inspections,
    (SELECT COUNT(*) FROM inspections WHERE status = 'completed') as completed_inspections,
    (SELECT COUNT(*) FROM inspections WHERE status = 'pending') as pending_inspections,
    (SELECT COUNT(*) FROM inspections WHERE status = 'failed') as failed_inspections,
    
    -- Maintenance metrics (table does not exist yet)
    0 as total_maintenance_tasks,
    0 as completed_tasks,
    0 as pending_tasks,
    0 as overdue_tasks;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- QUOTATIONS ANALYTICS OPTIMIZATION
-- ==============================================

-- Function to get quotations analytics with date range
CREATE OR REPLACE FUNCTION get_quotations_analytics(
  from_date timestamp with time zone DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  to_date timestamp with time zone DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_revenue numeric,
  total_quotations bigint,
  avg_quote_value numeric,
  approval_rate numeric,
  conversion_rate numeric,
  status_counts jsonb,
  daily_revenue jsonb
) AS $$
DECLARE
  total_rev numeric;
  total_quotes bigint;
  avg_value numeric;
  approved_count bigint;
  rejected_count bigint;
  sent_count bigint;
  converted_count bigint;
  approval_rate_val numeric;
  conversion_rate_val numeric;
BEGIN
  -- Calculate basic metrics
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*),
    COALESCE(AVG(total_amount), 0)
  INTO total_rev, total_quotes, avg_value
  FROM quotations 
  WHERE created_at >= from_date AND created_at <= to_date;
  
  -- Calculate status counts
  SELECT 
    COUNT(CASE WHEN status = 'approved' THEN 1 END),
    COUNT(CASE WHEN status = 'rejected' THEN 1 END),
    COUNT(CASE WHEN status = 'sent' THEN 1 END),
    COUNT(CASE WHEN status = 'converted' THEN 1 END)
  INTO approved_count, rejected_count, sent_count, converted_count
  FROM quotations 
  WHERE created_at >= from_date AND created_at <= to_date;
  
  -- Calculate rates
  approval_rate_val := CASE 
    WHEN (approved_count + rejected_count) > 0 
    THEN ROUND((approved_count::numeric / (approved_count + rejected_count)) * 100, 2)
    ELSE 0 
  END;
  
  conversion_rate_val := CASE 
    WHEN (sent_count + approved_count) > 0 
    THEN ROUND((converted_count::numeric / (sent_count + approved_count)) * 100, 2)
    ELSE 0 
  END;
  
  RETURN QUERY
  SELECT 
    total_rev,
    total_quotes,
    avg_value,
    approval_rate_val,
    conversion_rate_val,
    (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count
        FROM quotations 
        WHERE created_at >= from_date AND created_at <= to_date
        GROUP BY status
      ) status_counts
    ) as status_counts,
    (
      SELECT jsonb_object_agg(date_trunc('day', created_at)::date::text, daily_total)
      FROM (
        SELECT 
          created_at,
          SUM(total_amount) as daily_total
        FROM quotations 
        WHERE created_at >= from_date AND created_at <= to_date
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
      ) daily_data
    ) as daily_revenue;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- BOOKINGS ANALYTICS OPTIMIZATION
-- ==============================================

-- Function to get bookings analytics with date range
CREATE OR REPLACE FUNCTION get_bookings_analytics(
  from_date timestamp with time zone DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  to_date timestamp with time zone DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_bookings bigint,
  active_bookings bigint,
  completed_bookings bigint,
  cancelled_bookings bigint,
  total_revenue numeric,
  avg_booking_value numeric,
  daily_bookings jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
    COALESCE(SUM(price_amount), 0) as total_revenue,
    COALESCE(AVG(price_amount), 0) as avg_booking_value,
    (
      SELECT jsonb_object_agg(date_trunc('day', created_at)::date::text, daily_count)
      FROM (
        SELECT 
          created_at,
          COUNT(*) as daily_count
        FROM bookings 
        WHERE created_at >= from_date AND created_at <= to_date
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
      ) daily_data
    ) as daily_bookings
  FROM bookings 
  WHERE created_at >= from_date AND created_at <= to_date;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- VEHICLE UTILIZATION OPTIMIZATION
-- ==============================================

-- Function to get vehicle utilization metrics
CREATE OR REPLACE FUNCTION get_vehicle_utilization()
RETURNS TABLE (
  vehicle_id uuid,
  vehicle_name text,
  plate_number text,
  brand text,
  model text,
  year integer,
  status text,
  total_bookings bigint,
  total_inspections bigint,
  total_maintenance_tasks bigint,
  last_booking_date timestamp with time zone,
  last_inspection_date timestamp with time zone,
  last_maintenance_date timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vehicle_id,
    v.name as vehicle_name,
    v.plate_number,
    v.brand,
    v.model,
    v.year,
    v.status,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT i.id) as total_inspections,
    0 as total_maintenance_tasks,
    MAX(b.date) as last_booking_date,
    MAX(i.date) as last_inspection_date,
    NULL as last_maintenance_date
  FROM vehicles v
  LEFT JOIN bookings b ON v.id = b.vehicle_id
  LEFT JOIN inspections i ON v.id = i.vehicle_id
  -- LEFT JOIN maintenance_tasks mt ON v.id = mt.vehicle_id -- Table does not exist yet
  GROUP BY v.id, v.name, v.plate_number, v.brand, v.model, v.year, v.status
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- DRIVER PERFORMANCE OPTIMIZATION
-- ==============================================

-- Function to get driver performance metrics
CREATE OR REPLACE FUNCTION get_driver_performance()
RETURNS TABLE (
  driver_id uuid,
  first_name text,
  last_name text,
  email text,
  status text,
  total_bookings bigint,
  completed_bookings bigint,
  total_inspections bigint,
  completed_inspections bigint,
  avg_rating numeric,
  last_activity timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.first_name,
    d.last_name,
    d.email,
    d.status,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
    COUNT(DISTINCT i.id) as total_inspections,
    COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END) as completed_inspections,
    COALESCE(AVG(b.rating), 0) as avg_rating,
    GREATEST(MAX(b.date), MAX(i.date)) as last_activity
  FROM drivers d
  LEFT JOIN bookings b ON d.id = b.driver_id
  LEFT JOIN inspections i ON d.id = i.inspector_id
  GROUP BY d.id, d.first_name, d.last_name, d.email, d.status
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- OPTIMIZED QUOTATIONS SEARCH
-- ==============================================

-- Function for optimized quotations search with full-text search
CREATE OR REPLACE FUNCTION search_quotations(
  search_term text DEFAULT '',
  status_filter text DEFAULT 'all',
  user_email text DEFAULT '',
  is_organization_member boolean DEFAULT false,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  customer_name text,
  customer_email text,
  status text,
  total_amount numeric,
  created_at timestamp with time zone,
  pickup_date date,
  quotation_items jsonb,
  total_count bigint
) AS $$
DECLARE
  total_records bigint;
BEGIN
  -- Get total count for pagination
  SELECT COUNT(*)
  INTO total_records
  FROM quotations q
  WHERE 
    (status_filter = 'all' OR q.status = status_filter)
    AND (NOT is_organization_member OR q.customer_email = user_email)
    AND (search_term = '' OR to_tsvector('english', 
          COALESCE(q.customer_name, '') || ' ' || 
          COALESCE(q.customer_email, '') || ' ' || 
          COALESCE(q.title, '')
        ) @@ plainto_tsquery('english', search_term));
  
  RETURN QUERY
  SELECT 
    q.id,
    q.title,
    q.customer_name,
    q.customer_email,
    q.status,
    q.total_amount,
    q.created_at,
    q.pickup_date,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', qi.id,
          'unit_price', qi.unit_price,
          'total_price', qi.total_price,
          'quantity', qi.quantity,
          'service_days', qi.service_days,
          'time_based_adjustment', qi.time_based_adjustment
        )
      )
      FROM quotation_items qi
      WHERE qi.quotation_id = q.id
    ) as quotation_items,
    total_records as total_count
  FROM quotations q
  WHERE 
    (status_filter = 'all' OR q.status = status_filter)
    AND (NOT is_organization_member OR q.customer_email = user_email)
    AND (search_term = '' OR to_tsvector('english', 
          COALESCE(q.customer_name, '') || ' ' || 
          COALESCE(q.customer_email, '') || ' ' || 
          COALESCE(q.title, '')
        ) @@ plainto_tsquery('english', search_term))
  ORDER BY q.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_quotations_analytics(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bookings_analytics(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vehicle_utilization() TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION search_quotations(text, text, text, boolean, integer, integer) TO authenticated;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON FUNCTION get_dashboard_metrics() IS 'Returns comprehensive dashboard metrics in a single optimized query';
COMMENT ON FUNCTION get_quotations_analytics(timestamp with time zone, timestamp with time zone) IS 'Returns quotations analytics with date range filtering and aggregations';
COMMENT ON FUNCTION get_bookings_analytics(timestamp with time zone, timestamp with time zone) IS 'Returns bookings analytics with date range filtering and aggregations';
COMMENT ON FUNCTION get_vehicle_utilization() IS 'Returns vehicle utilization metrics with related data';
COMMENT ON FUNCTION get_driver_performance() IS 'Returns driver performance metrics with related data';
COMMENT ON FUNCTION search_quotations(text, text, text, boolean, integer, integer) IS 'Optimized quotations search with full-text search and pagination';

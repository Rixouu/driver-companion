-- Phase 3A.2: Optimized Database Functions for Performance
-- This migration creates optimized functions to replace client-side aggregations

-- =============================================
-- DASHBOARD METRICS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_vehicles BIGINT,
  active_vehicles BIGINT,
  total_drivers BIGINT,
  active_drivers BIGINT,
  total_inspections BIGINT,
  pending_inspections BIGINT,
  in_progress_inspections BIGINT,
  completed_inspections BIGINT,
  total_quotations BIGINT,
  pending_quotations BIGINT,
  approved_quotations BIGINT,
  rejected_quotations BIGINT,
  total_bookings BIGINT,
  pending_bookings BIGINT,
  confirmed_bookings BIGINT,
  completed_bookings BIGINT,
  total_revenue NUMERIC,
  monthly_revenue NUMERIC,
  quarterly_revenue NUMERIC,
  yearly_revenue NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
  date_filter TEXT := '';
BEGIN
  -- Build date filter if provided
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || ''' AND created_at <= ''' || end_date || '''';
  ELSIF start_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || '''';
  ELSIF end_date IS NOT NULL THEN
    date_filter := ' AND created_at <= ''' || end_date || '''';
  END IF;

  RETURN QUERY
  WITH vehicle_stats AS (
    SELECT 
      COUNT(*) as total_vehicles,
      COUNT(*) FILTER (WHERE status = 'active') as active_vehicles
    FROM vehicles
  ),
  driver_stats AS (
    SELECT 
      COUNT(*) as total_drivers,
      COUNT(*) FILTER (WHERE status = 'active') as active_drivers
    FROM drivers
  ),
  inspection_stats AS (
    SELECT 
      COUNT(*) as total_inspections,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_inspections,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_inspections,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_inspections
    FROM inspections
    WHERE 1=1 || date_filter
  ),
  quotation_stats AS (
    SELECT 
      COUNT(*) as total_quotations,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_quotations,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_quotations,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_quotations,
      COALESCE(SUM(total_amount), 0) as total_revenue
    FROM quotations
    WHERE 1=1 || date_filter
  ),
  booking_stats AS (
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings
    FROM bookings
    WHERE 1=1 || date_filter
  ),
  revenue_stats AS (
    SELECT 
      COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 month'), 0) as monthly_revenue,
      COALESCE(SUM(total_amount) FILTER (WHERE created_at >= DATE_TRUNC('quarter', CURRENT_DATE)), 0) as quarterly_revenue,
      COALESCE(SUM(total_amount) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)), 0) as yearly_revenue
    FROM quotations
    WHERE status = 'approved'
  )
  SELECT 
    vs.total_vehicles,
    vs.active_vehicles,
    ds.total_drivers,
    ds.active_drivers,
    ins.total_inspections,
    ins.pending_inspections,
    ins.in_progress_inspections,
    ins.completed_inspections,
    qs.total_quotations,
    qs.pending_quotations,
    qs.approved_quotations,
    qs.rejected_quotations,
    bs.total_bookings,
    bs.pending_bookings,
    bs.confirmed_bookings,
    bs.completed_bookings,
    qs.total_revenue,
    rs.monthly_revenue,
    rs.quarterly_revenue,
    rs.yearly_revenue
  FROM vehicle_stats vs
  CROSS JOIN driver_stats ds
  CROSS JOIN inspection_stats ins
  CROSS JOIN quotation_stats qs
  CROSS JOIN booking_stats bs
  CROSS JOIN revenue_stats rs;
END;
$$;

-- =============================================
-- QUOTATION SEARCH FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION search_quotations(
  search_term TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  payment_status_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  quote_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  title TEXT,
  total_amount NUMERIC,
  status TEXT,
  payment_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  quotation_items JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.quote_number,
    q.customer_name,
    q.customer_email,
    q.title,
    q.total_amount,
    q.status,
    q.payment_status,
    q.created_at,
    q.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', qi.id,
            'service_type_id', qi.service_type_id,
            'unit_price', qi.unit_price,
            'quantity', qi.quantity,
            'total_price', qi.total_price,
            'service_days', qi.service_days,
            'time_based_adjustment', qi.time_based_adjustment,
            'vehicle_type', qi.vehicle_type,
            'vehicle_category', qi.vehicle_category
          )
        )
        FROM quotation_items qi
        WHERE qi.quotation_id = q.id
      ),
      '[]'::jsonb
    ) as quotation_items
  FROM quotations q
  WHERE 
    (search_term IS NULL OR 
     to_tsvector('english', 
       COALESCE(q.customer_name, '') || ' ' || 
       COALESCE(q.customer_email, '') || ' ' || 
       COALESCE(q.title, '')
     ) @@ plainto_tsquery('english', search_term))
    AND (status_filter IS NULL OR q.status = status_filter)
    AND (payment_status_filter IS NULL OR q.payment_status = payment_status_filter)
    AND (start_date IS NULL OR q.created_at >= start_date)
    AND (end_date IS NULL OR q.created_at <= end_date)
  ORDER BY q.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- =============================================
-- VEHICLE ANALYTICS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_vehicle_analytics(
  vehicle_id UUID DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  vehicle_id UUID,
  vehicle_name TEXT,
  plate_number TEXT,
  brand TEXT,
  model TEXT,
  year INTEGER,
  status TEXT,
  total_inspections BIGINT,
  last_inspection_date TIMESTAMPTZ,
  total_maintenance_tasks BIGINT,
  last_maintenance_date TIMESTAMPTZ,
  total_bookings BIGINT,
  last_booking_date TIMESTAMPTZ,
  inspection_success_rate NUMERIC,
  maintenance_completion_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  date_filter TEXT := '';
BEGIN
  -- Build date filter if provided
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || ''' AND created_at <= ''' || end_date || '''';
  ELSIF start_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || '''';
  ELSIF end_date IS NOT NULL THEN
    date_filter := ' AND created_at <= ''' || end_date || '''';
  END IF;

  RETURN QUERY
  SELECT 
    v.id as vehicle_id,
    v.name as vehicle_name,
    v.plate_number,
    v.brand,
    v.model,
    v.year,
    v.status,
    COUNT(DISTINCT i.id) as total_inspections,
    MAX(i.created_at) as last_inspection_date,
    0 as total_maintenance_tasks, -- Placeholder since maintenance_tasks table doesn't exist
    NULL::TIMESTAMPTZ as last_maintenance_date,
    COUNT(DISTINCT b.id) as total_bookings,
    MAX(b.created_at) as last_booking_date,
    CASE 
      WHEN COUNT(DISTINCT i.id) > 0 THEN 
        (COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'completed'))::NUMERIC / COUNT(DISTINCT i.id)::NUMERIC * 100
      ELSE 0
    END as inspection_success_rate,
    0::NUMERIC as maintenance_completion_rate -- Placeholder
  FROM vehicles v
  LEFT JOIN inspections i ON v.id = i.vehicle_id AND (1=1 || date_filter)
  LEFT JOIN bookings b ON v.id = b.vehicle_id AND (1=1 || date_filter)
  WHERE (vehicle_id IS NULL OR v.id = vehicle_id)
  GROUP BY v.id, v.name, v.plate_number, v.brand, v.model, v.year, v.status
  ORDER BY v.created_at DESC;
END;
$$;

-- =============================================
-- DRIVER ANALYTICS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_driver_analytics(
  driver_id UUID DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  email TEXT,
  phone TEXT,
  license_number TEXT,
  status TEXT,
  total_inspections BIGINT,
  last_inspection_date TIMESTAMPTZ,
  total_bookings BIGINT,
  last_booking_date TIMESTAMPTZ,
  inspection_completion_rate NUMERIC,
  average_inspection_rating NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  date_filter TEXT := '';
BEGIN
  -- Build date filter if provided
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || ''' AND created_at <= ''' || end_date || '''';
  ELSIF start_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || '''';
  ELSIF end_date IS NOT NULL THEN
    date_filter := ' AND created_at <= ''' || end_date || '''';
  END IF;

  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.email,
    d.phone,
    d.license_number,
    d.status,
    COUNT(DISTINCT i.id) as total_inspections,
    MAX(i.created_at) as last_inspection_date,
    COUNT(DISTINCT b.id) as total_bookings,
    MAX(b.created_at) as last_booking_date,
    CASE 
      WHEN COUNT(DISTINCT i.id) > 0 THEN 
        (COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'completed'))::NUMERIC / COUNT(DISTINCT i.id)::NUMERIC * 100
      ELSE 0
    END as inspection_completion_rate,
    COALESCE(AVG(i.rating), 0) as average_inspection_rating
  FROM drivers d
  LEFT JOIN inspections i ON d.id = i.inspector_id AND (1=1 || date_filter)
  LEFT JOIN bookings b ON d.id = b.driver_id AND (1=1 || date_filter)
  WHERE (driver_id IS NULL OR d.id = driver_id)
  GROUP BY d.id, d.name, d.email, d.phone, d.license_number, d.status
  ORDER BY d.created_at DESC;
END;
$$;

-- =============================================
-- REVENUE ANALYTICS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_revenue_analytics(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  group_by TEXT DEFAULT 'month' -- 'day', 'week', 'month', 'quarter', 'year'
)
RETURNS TABLE (
  period_start DATE,
  period_end DATE,
  total_revenue NUMERIC,
  total_quotations BIGINT,
  approved_quotations BIGINT,
  rejected_quotations BIGINT,
  average_quote_value NUMERIC,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  date_filter TEXT := '';
  group_clause TEXT := '';
BEGIN
  -- Build date filter if provided
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || ''' AND created_at <= ''' || end_date || '''';
  ELSIF start_date IS NOT NULL THEN
    date_filter := ' AND created_at >= ''' || start_date || '''';
  ELSIF end_date IS NOT NULL THEN
    date_filter := ' AND created_at <= ''' || end_date || '''';
  END IF;

  -- Build group by clause
  CASE group_by
    WHEN 'day' THEN group_clause := 'DATE(created_at)';
    WHEN 'week' THEN group_clause := 'DATE_TRUNC(''week'', created_at)::DATE';
    WHEN 'month' THEN group_clause := 'DATE_TRUNC(''month'', created_at)::DATE';
    WHEN 'quarter' THEN group_clause := 'DATE_TRUNC(''quarter'', created_at)::DATE';
    WHEN 'year' THEN group_clause := 'DATE_TRUNC(''year'', created_at)::DATE';
    ELSE group_clause := 'DATE_TRUNC(''month'', created_at)::DATE';
  END CASE;

  RETURN QUERY
  EXECUTE format('
    SELECT 
      %s as period_start,
      CASE 
        WHEN ''%s'' = ''day'' THEN %s
        WHEN ''%s'' = ''week'' THEN %s + INTERVAL ''6 days''
        WHEN ''%s'' = ''month'' THEN %s + INTERVAL ''1 month'' - INTERVAL ''1 day''
        WHEN ''%s'' = ''quarter'' THEN %s + INTERVAL ''3 months'' - INTERVAL ''1 day''
        WHEN ''%s'' = ''year'' THEN %s + INTERVAL ''1 year'' - INTERVAL ''1 day''
        ELSE %s + INTERVAL ''1 month'' - INTERVAL ''1 day''
      END::DATE as period_end,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COUNT(*) as total_quotations,
      COUNT(*) FILTER (WHERE status = ''approved'') as approved_quotations,
      COUNT(*) FILTER (WHERE status = ''rejected'') as rejected_quotations,
      COALESCE(AVG(total_amount), 0) as average_quote_value,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE status = ''approved''))::NUMERIC / COUNT(*)::NUMERIC * 100
        ELSE 0
      END as conversion_rate
    FROM quotations
    WHERE 1=1 %s
    GROUP BY %s
    ORDER BY %s DESC',
    group_clause, group_by, group_clause, group_by, group_clause, group_by, group_clause, group_by, group_clause, group_by, group_clause, group_clause, date_filter, group_clause, group_clause
  );
END;
$$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION search_quotations TO authenticated;
GRANT EXECUTE ON FUNCTION get_vehicle_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_analytics TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_dashboard_metrics TO service_role;
GRANT EXECUTE ON FUNCTION search_quotations TO service_role;
GRANT EXECUTE ON FUNCTION get_vehicle_analytics TO service_role;
GRANT EXECUTE ON FUNCTION get_driver_analytics TO service_role;
GRANT EXECUTE ON FUNCTION get_revenue_analytics TO service_role;

-- Fix for get_crew_task_schedule function
-- Issue: Line 224 has (gs.task_date - ct.start_date + 1) which causes type error
-- Fix: Cast to integer properly

DROP FUNCTION IF EXISTS get_crew_task_schedule;

CREATE OR REPLACE FUNCTION get_crew_task_schedule(
  p_start_date DATE,
  p_end_date DATE,
  p_driver_ids UUID[] DEFAULT NULL,
  p_task_numbers INT[] DEFAULT NULL
)
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  task_date DATE,
  tasks JSON
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date::DATE, p_end_date::DATE, '1 day'::interval)::DATE AS task_date
  ),
  driver_list AS (
    SELECT 
      d.id AS driver_id,
      d.first_name || ' ' || d.last_name AS driver_name
    FROM drivers d
    WHERE d.deleted_at IS NULL
      AND (p_driver_ids IS NULL OR d.id = ANY(p_driver_ids))
  ),
  tasks_expanded AS (
    -- Expand multi-day tasks into individual days
    SELECT 
      ct.id,
      ct.task_number,
      ct.task_type::TEXT,
      ct.task_status::TEXT,
      ct.driver_id,
      gs.task_date::DATE,
      ct.start_date,
      ct.end_date,
      ct.start_time,
      ct.end_time,
      ct.total_days,
      ct.hours_per_day,
      ct.total_hours,
      -- Calculate which day of the task this is (Day 1/3, Day 2/3, etc.)
      -- FIX: Properly cast date difference to integer
      (gs.task_date::DATE - ct.start_date::DATE + 1)::INT AS current_day_number,
      ct.title,
      ct.description,
      ct.location,
      ct.customer_name,
      ct.customer_phone,
      ct.color_override,
      ct.priority,
      ct.notes,
      ct.booking_id,
      b.wp_id AS booking_wp_id,
      b.service_name AS booking_service_name,
      b.price_formatted AS booking_price
    FROM crew_tasks ct
    LEFT JOIN bookings b ON ct.booking_id = b.id
    CROSS JOIN LATERAL generate_series(ct.start_date, ct.end_date, '1 day'::interval) AS gs(task_date)
    WHERE (p_driver_ids IS NULL OR ct.driver_id = ANY(p_driver_ids))
      AND (p_task_numbers IS NULL OR ct.task_number = ANY(p_task_numbers))
      AND gs.task_date::DATE BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    dl.driver_id,
    dl.driver_name,
    ds.task_date,
    COALESCE(
      json_agg(
        json_build_object(
          'id', te.id,
          'task_number', te.task_number,
          'task_type', te.task_type,
          'task_status', te.task_status,
          'start_date', te.start_date,
          'end_date', te.end_date,
          'start_time', te.start_time,
          'end_time', te.end_time,
          'total_days', te.total_days,
          'current_day', te.current_day_number,
          'hours_per_day', te.hours_per_day,
          'total_hours', te.total_hours,
          'title', te.title,
          'description', te.description,
          'location', te.location,
          'customer_name', te.customer_name,
          'customer_phone', te.customer_phone,
          'color_override', te.color_override,
          'priority', te.priority,
          'notes', te.notes,
          'booking_id', te.booking_id,
          'booking_wp_id', te.booking_wp_id,
          'booking_service_name', te.booking_service_name,
          'booking_price', te.booking_price,
          'is_multi_day', te.total_days > 1,
          'is_first_day', te.current_day_number = 1,
          'is_last_day', te.current_day_number = te.total_days
        ) ORDER BY te.priority DESC, te.start_time NULLS LAST, te.task_number
      ) FILTER (WHERE te.id IS NOT NULL),
      '[]'::json
    ) AS tasks
  FROM driver_list dl
  CROSS JOIN date_series ds
  LEFT JOIN tasks_expanded te ON dl.driver_id = te.driver_id AND ds.task_date = te.task_date
  GROUP BY dl.driver_id, dl.driver_name, ds.task_date
  ORDER BY dl.driver_name, ds.task_date;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_crew_task_schedule(
  '2025-10-01'::DATE,
  '2025-10-07'::DATE,
  NULL,
  NULL
) LIMIT 3;


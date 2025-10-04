-- Fix get_shift_schedule function to properly cast timestamp to date
-- This fixes the "structure of query does not match function result type" error

DROP FUNCTION IF EXISTS get_shift_schedule(DATE, DATE, UUID[]);

CREATE OR REPLACE FUNCTION get_shift_schedule(
  p_start_date DATE,
  p_end_date DATE,
  p_driver_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  shift_date DATE,
  shifts JSON,
  bookings JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id AS driver_id,
    d.first_name || ' ' || d.last_name AS driver_name,
    dates.date::DATE AS shift_date,
    COALESCE(
      json_agg(
        json_build_object(
          'shift_id', ds.id,
          'start_time', ds.shift_start_time,
          'end_time', ds.shift_end_time,
          'type', ds.shift_type,
          'status', ds.status,
          'notes', ds.notes
        ) ORDER BY ds.shift_start_time
      ) FILTER (WHERE ds.id IS NOT NULL),
      '[]'::json
    ) AS shifts,
    COALESCE(
      json_agg(
        json_build_object(
          'booking_id', b.id,
          'wp_id', b.wp_id,
          'time', b.time,
          'status', b.status,
          'customer_name', b.customer_name,
          'service_name', b.service_name,
          'service_type', b.service_type,
          'pickup_location', b.pickup_location,
          'dropoff_location', b.dropoff_location,
          'duration_hours', b.duration_hours,
          'price_amount', b.price_amount,
          'price_formatted', b.price_formatted,
          'vehicle_make', b.vehicle_make,
          'vehicle_model', b.vehicle_model,
          'assignment_status', da.status
        ) ORDER BY b.time
      ) FILTER (WHERE b.id IS NOT NULL),
      '[]'::json
    ) AS bookings
  FROM 
    generate_series(p_start_date::timestamp, p_end_date::timestamp, '1 day'::interval) AS dates(date)
  CROSS JOIN drivers d
  LEFT JOIN driver_shifts ds ON d.id = ds.driver_id AND ds.shift_date = dates.date::DATE
  LEFT JOIN bookings b ON d.id = b.driver_id AND b.date = dates.date::DATE
  LEFT JOIN dispatch_assignments da ON b.id = da.booking_id AND d.id = da.driver_id
  WHERE 
    d.deleted_at IS NULL
    AND (p_driver_ids IS NULL OR d.id = ANY(p_driver_ids))
  GROUP BY d.id, d.first_name, d.last_name, dates.date
  ORDER BY d.first_name, d.last_name, dates.date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_shift_schedule IS 'Returns shift schedule with bookings for a date range - Fixed date type casting';


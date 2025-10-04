-- Fix get_shift_schedule function to properly handle multi-day bookings
-- This will expand bookings across multiple days based on service_days and hours_per_day

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
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE as date
  ),
  driver_list AS (
    SELECT 
      d.id,
      d.first_name || ' ' || d.last_name as name
    FROM drivers d
    WHERE (p_driver_ids IS NULL OR d.id = ANY(p_driver_ids))
  ),
  -- Get all bookings that overlap with the date range
  booking_data AS (
    SELECT 
      b.id as booking_id,
      b.wp_id,
      b.date as booking_date,
      b.time,
      b.status,
      b.customer_name,
      b.service_name,
      b.service_type,
      b.pickup_location,
      b.dropoff_location,
      b.duration_hours,
      b.price_amount,
      b.price_formatted,
      b.vehicle_make,
      b.vehicle_model,
      b.assignment_status,
      b.driver_id,
      COALESCE(b.service_days, 1) as service_days,
      COALESCE(b.hours_per_day, b.duration_hours) as hours_per_day,
      -- Calculate the actual end date based on service_days
      (b.date::DATE + INTERVAL '1 day' * (COALESCE(b.service_days, 1) - 1))::DATE as booking_end_date
    FROM bookings b
    WHERE b.driver_id IS NOT NULL
      AND (p_driver_ids IS NULL OR b.driver_id = ANY(p_driver_ids))
      -- Check if booking overlaps with our date range
      AND b.date::DATE <= p_end_date
      AND (b.date::DATE + INTERVAL '1 day' * (COALESCE(b.service_days, 1) - 1))::DATE >= p_start_date
  ),
  -- Expand multi-day bookings across all their days
  expanded_bookings AS (
    SELECT 
      bd.booking_id,
      bd.wp_id,
      bd.booking_date,
      bd.time,
      bd.status,
      bd.customer_name,
      bd.service_name,
      bd.service_type,
      bd.pickup_location,
      bd.dropoff_location,
      bd.hours_per_day as duration_hours, -- Use hours_per_day for each day
      bd.price_amount / bd.service_days as price_amount, -- Split price across days
      bd.price_formatted,
      bd.vehicle_make,
      bd.vehicle_model,
      bd.assignment_status,
      bd.driver_id,
      bd.service_days,
      bd.hours_per_day,
      ds.date as shift_date,
      -- Calculate which day of the service this is (1, 2, 3, etc.)
      (ds.date - bd.booking_date::DATE + 1) as day_number
    FROM booking_data bd
    CROSS JOIN date_series ds
    WHERE ds.date >= bd.booking_date::DATE 
      AND ds.date <= bd.booking_end_date
  ),
  -- Group bookings by driver and date
  grouped_data AS (
    SELECT 
      dl.id as driver_id,
      dl.name as driver_name,
      ds.date as shift_date,
      COALESCE(
        json_agg(
          json_build_object(
            'booking_id', eb.booking_id,
            'wp_id', eb.wp_id,
            'time', eb.time,
            'status', eb.status,
            'customer_name', eb.customer_name,
            'service_name', eb.service_name,
            'service_type', eb.service_type,
            'pickup_location', eb.pickup_location,
            'dropoff_location', eb.dropoff_location,
            'duration_hours', eb.duration_hours,
            'price_amount', eb.price_amount,
            'price_formatted', eb.price_formatted,
            'vehicle_make', eb.vehicle_make,
            'vehicle_model', eb.vehicle_model,
            'assignment_status', eb.assignment_status,
            'service_days', eb.service_days,
            'day_number', eb.day_number
          )
        ) FILTER (WHERE eb.booking_id IS NOT NULL),
        '[]'::json
      ) as bookings,
      COALESCE(
        json_agg(
          json_build_object(
            'shift_id', 'placeholder',
            'start_time', '09:00',
            'end_time', '17:00',
            'type', 'regular',
            'status', 'scheduled',
            'notes', 'Placeholder shift'
          )
        ) FILTER (WHERE false), -- No shifts for now
        '[]'::json
      ) as shifts
    FROM driver_list dl
    CROSS JOIN date_series ds
    LEFT JOIN expanded_bookings eb ON dl.id = eb.driver_id AND ds.date = eb.shift_date
    GROUP BY dl.id, dl.name, ds.date
  )
  SELECT 
    gd.driver_id,
    gd.driver_name,
    gd.shift_date,
    gd.shifts,
    gd.bookings
  FROM grouped_data gd
  ORDER BY gd.driver_name, gd.shift_date;
END;
$$;

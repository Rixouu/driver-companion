-- Driver Shifts Management Schema
-- This migration creates tables and views for managing driver shifts and schedules

-- Create driver_shifts table (for planned shifts/availability)
CREATE TABLE IF NOT EXISTS driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  shift_type VARCHAR(50) DEFAULT 'regular', -- regular, overtime, on-call, etc.
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, active, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(driver_id, shift_date, shift_start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_shifts_driver_id ON driver_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_shift_date ON driver_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_status ON driver_shifts(status);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_date_range ON driver_shifts(shift_date, driver_id);

-- Create view for shift schedule with driver and booking information
CREATE OR REPLACE VIEW driver_shift_schedule AS
SELECT 
  d.id AS driver_id,
  d.first_name,
  d.last_name,
  d.email,
  d.phone,
  d.line_id,
  ds.id AS shift_id,
  ds.shift_date,
  ds.shift_start_time,
  ds.shift_end_time,
  ds.shift_type,
  ds.status AS shift_status,
  ds.notes AS shift_notes,
  -- Aggregate bookings for this driver on this date
  COALESCE(
    json_agg(
      json_build_object(
        'booking_id', b.id,
        'wp_id', b.wp_id,
        'booking_date', b.date,
        'booking_time', b.time,
        'status', b.status,
        'customer_name', b.customer_name,
        'service_name', b.service_name,
        'service_type', b.service_type,
        'pickup_location', b.pickup_location,
        'dropoff_location', b.dropoff_location,
        'duration_hours', b.duration_hours,
        'price_amount', b.price_amount,
        'vehicle_make', b.vehicle_make,
        'vehicle_model', b.vehicle_model,
        'assignment_status', da.status,
        'assigned_at', da.assigned_at,
        'started_at', da.started_at,
        'completed_at', da.completed_at
      ) ORDER BY b.time
    ) FILTER (WHERE b.id IS NOT NULL),
    '[]'::json
  ) AS bookings,
  -- Count bookings
  COUNT(b.id) AS booking_count
FROM drivers d
LEFT JOIN driver_shifts ds ON d.id = ds.driver_id
LEFT JOIN bookings b ON d.id = b.driver_id AND b.date = ds.shift_date
LEFT JOIN dispatch_assignments da ON b.id = da.booking_id AND d.id = da.driver_id
WHERE d.deleted_at IS NULL
GROUP BY 
  d.id, d.first_name, d.last_name, d.email, d.phone, d.line_id,
  ds.id, ds.shift_date, ds.shift_start_time, ds.shift_end_time, 
  ds.shift_type, ds.status, ds.notes;

-- Create view for monthly shift overview
CREATE OR REPLACE VIEW monthly_shift_overview AS
SELECT 
  d.id AS driver_id,
  d.first_name || ' ' || d.last_name AS driver_name,
  DATE_TRUNC('month', ds.shift_date) AS month,
  COUNT(DISTINCT ds.id) AS total_shifts,
  COUNT(DISTINCT CASE WHEN ds.status = 'completed' THEN ds.id END) AS completed_shifts,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS completed_bookings,
  COALESCE(SUM(b.duration_hours), 0) AS total_hours,
  COALESCE(SUM(b.price_amount), 0) AS total_revenue
FROM drivers d
LEFT JOIN driver_shifts ds ON d.id = ds.driver_id
LEFT JOIN bookings b ON d.id = b.driver_id AND b.date = ds.shift_date
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.first_name, d.last_name, DATE_TRUNC('month', ds.shift_date);

-- Function to get shift schedule for a date range
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
    dates.date AS shift_date,
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
    generate_series(p_start_date, p_end_date, '1 day'::interval) AS dates(date)
  CROSS JOIN drivers d
  LEFT JOIN driver_shifts ds ON d.id = ds.driver_id AND ds.shift_date = dates.date
  LEFT JOIN bookings b ON d.id = b.driver_id AND b.date = dates.date
  LEFT JOIN dispatch_assignments da ON b.id = da.booking_id AND d.id = da.driver_id
  WHERE 
    d.deleted_at IS NULL
    AND (p_driver_ids IS NULL OR d.id = ANY(p_driver_ids))
  GROUP BY d.id, d.first_name, d.last_name, dates.date
  ORDER BY d.first_name, d.last_name, dates.date;
END;
$$ LANGUAGE plpgsql;

-- Function to check driver availability
CREATE OR REPLACE FUNCTION check_driver_availability(
  p_driver_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_hours INTEGER
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflict_reason TEXT,
  conflicts JSON
) AS $$
DECLARE
  v_end_time TIME;
  v_has_shift BOOLEAN;
  v_conflicts JSON;
BEGIN
  v_end_time := p_start_time + (p_duration_hours || ' hours')::INTERVAL;
  
  -- Check if driver has a shift on this date
  SELECT EXISTS(
    SELECT 1 FROM driver_shifts 
    WHERE driver_id = p_driver_id 
    AND shift_date = p_date
    AND status NOT IN ('cancelled')
  ) INTO v_has_shift;
  
  -- Check for booking conflicts
  SELECT json_agg(
    json_build_object(
      'booking_id', b.id,
      'wp_id', b.wp_id,
      'time', b.time,
      'duration_hours', b.duration_hours,
      'customer_name', b.customer_name,
      'service_name', b.service_name
    )
  )
  FROM bookings b
  WHERE b.driver_id = p_driver_id
  AND b.date = p_date
  AND b.status NOT IN ('cancelled', 'completed')
  AND (
    -- Time overlap check
    (b.time::TIME, (b.time::TIME + (COALESCE(b.duration_hours, 1) || ' hours')::INTERVAL)) 
    OVERLAPS 
    (p_start_time, v_end_time)
  )
  INTO v_conflicts;
  
  IF NOT v_has_shift THEN
    RETURN QUERY SELECT FALSE, 'No shift scheduled'::TEXT, v_conflicts;
  ELSIF v_conflicts IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Time conflict with existing bookings'::TEXT, v_conflicts;
  ELSE
    RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::JSON;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for driver_shifts
ALTER TABLE driver_shifts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read shifts
CREATE POLICY "Authenticated users can view driver shifts"
  ON driver_shifts FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to manage shifts (admin role)
CREATE POLICY "Admins can manage driver shifts"
  ON driver_shifts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_driver_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_shifts_updated_at
  BEFORE UPDATE ON driver_shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_shifts_updated_at();

-- Add comments for documentation
COMMENT ON TABLE driver_shifts IS 'Stores planned shifts and availability for drivers';
COMMENT ON COLUMN driver_shifts.shift_type IS 'Type of shift: regular, overtime, on-call, split, etc.';
COMMENT ON COLUMN driver_shifts.status IS 'Status: scheduled, active, completed, cancelled';
COMMENT ON FUNCTION get_shift_schedule IS 'Returns shift schedule with bookings for a date range';
COMMENT ON FUNCTION check_driver_availability IS 'Checks if a driver is available for a booking at specified time';


-- =====================================================
-- CREW TASKS TABLE - Task-Based Crew Allocation System
-- =====================================================
-- This table manages task assignments (numbered 1-10+) for drivers
-- Supports multi-day tasks, charter services, training, day off, etc.
-- =====================================================

-- Drop existing objects if they exist
DROP TABLE IF EXISTS crew_tasks CASCADE;
DROP VIEW IF EXISTS crew_task_schedule_view CASCADE;
DROP FUNCTION IF EXISTS get_crew_task_schedule CASCADE;
DROP FUNCTION IF EXISTS check_driver_task_conflicts CASCADE;
DROP TYPE IF EXISTS task_type_enum CASCADE;
DROP TYPE IF EXISTS task_status_enum CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE task_type_enum AS ENUM (
  'charter',      -- Multi-day charter services
  'regular',      -- Regular single-day tasks
  'training',     -- Driver training
  'day_off',      -- Day off / leave
  'maintenance',  -- Vehicle maintenance
  'meeting',      -- Meetings / briefings
  'standby',      -- On-call / standby
  'special'       -- Special assignments
);

CREATE TYPE task_status_enum AS ENUM (
  'scheduled',    -- Task is scheduled
  'confirmed',    -- Task confirmed
  'in_progress',  -- Task in progress
  'completed',    -- Task completed
  'cancelled'     -- Task cancelled
);

-- =====================================================
-- MAIN TABLE: crew_tasks
-- =====================================================

CREATE TABLE crew_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Task Identification
  task_number INT NOT NULL CHECK (task_number >= 1 AND task_number <= 99), -- 1-10 primary, 11+ for extras
  task_type task_type_enum NOT NULL DEFAULT 'regular',
  task_status task_status_enum NOT NULL DEFAULT 'scheduled',
  
  -- Driver Assignment
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  
  -- Date & Time (supports multi-day)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL, -- For single day: end_date = start_date
  start_time TIME,        -- Optional start time (e.g., "16:00")
  end_time TIME,          -- Optional end time
  
  -- Duration (for multi-day tasks like charter)
  total_days INT GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  hours_per_day DECIMAL(4,2), -- e.g., 4.0 hours per day for 3-day charter
  total_hours DECIMAL(6,2),   -- Total hours for the entire task
  
  -- Link to Booking (if task is from a booking)
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Task Details
  title TEXT, -- e.g., "Charter Services", "Airport Transfer"
  description TEXT,
  location TEXT, -- Pickup or service location
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Visual & Organization
  color_override TEXT, -- Custom hex color (e.g., "#FF5733")
  priority INT DEFAULT 0, -- Higher number = higher priority
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time) OR
    (start_time IS NOT NULL AND end_time IS NULL)
  )
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_crew_tasks_driver_date ON crew_tasks(driver_id, start_date, end_date);
CREATE INDEX idx_crew_tasks_task_number ON crew_tasks(task_number);
CREATE INDEX idx_crew_tasks_date_range ON crew_tasks(start_date, end_date);
CREATE INDEX idx_crew_tasks_booking ON crew_tasks(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_crew_tasks_status ON crew_tasks(task_status);
CREATE INDEX idx_crew_tasks_type ON crew_tasks(task_type);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crew_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crew_tasks_updated_at
  BEFORE UPDATE ON crew_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_crew_tasks_updated_at();

-- =====================================================
-- VIEW: crew_task_schedule_view
-- =====================================================
-- Denormalized view for easy querying with driver info

CREATE VIEW crew_task_schedule_view AS
SELECT 
  ct.id,
  ct.task_number,
  ct.task_type,
  ct.task_status,
  ct.driver_id,
  d.first_name || ' ' || d.last_name AS driver_name,
  d.first_name,
  d.last_name,
  ct.start_date,
  ct.end_date,
  ct.start_time,
  ct.end_time,
  ct.total_days,
  ct.hours_per_day,
  ct.total_hours,
  ct.booking_id,
  ct.title,
  ct.description,
  ct.location,
  ct.customer_name,
  ct.customer_phone,
  ct.color_override,
  ct.priority,
  ct.notes,
  ct.created_at,
  ct.updated_at,
  -- Booking details if linked
  b.wp_id AS booking_wp_id,
  b.service_name AS booking_service_name,
  b.status AS booking_status,
  b.pickup_location AS booking_pickup_location,
  b.dropoff_location AS booking_dropoff_location,
  b.price_formatted AS booking_price
FROM crew_tasks ct
INNER JOIN drivers d ON ct.driver_id = d.id
LEFT JOIN bookings b ON ct.booking_id = b.id
WHERE d.deleted_at IS NULL;

-- =====================================================
-- FUNCTION: get_crew_task_schedule
-- =====================================================
-- Returns crew task schedule for date range with all task details

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
      (gs.task_date - ct.start_date + 1) AS current_day_number,
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
      AND gs.task_date BETWEEN p_start_date AND p_end_date
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

COMMENT ON FUNCTION get_crew_task_schedule IS 'Returns crew task schedule with multi-day tasks expanded into individual days';

-- =====================================================
-- FUNCTION: check_driver_task_conflicts
-- =====================================================
-- Check if a driver has conflicting tasks for a given date/time range

CREATE OR REPLACE FUNCTION check_driver_task_conflicts(
  p_driver_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_exclude_task_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_id UUID,
  task_number INT,
  title TEXT,
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id AS conflict_id,
    ct.task_number,
    ct.title,
    ct.start_date,
    ct.end_date,
    ct.start_time,
    ct.end_time
  FROM crew_tasks ct
  WHERE ct.driver_id = p_driver_id
    AND ct.task_status NOT IN ('cancelled', 'completed')
    AND (p_exclude_task_id IS NULL OR ct.id != p_exclude_task_id)
    AND (
      -- Date range overlaps
      (ct.start_date, ct.end_date) OVERLAPS (p_start_date, p_end_date)
    )
    AND (
      -- If times provided, check time overlap; otherwise just date overlap is conflict
      p_start_time IS NULL 
      OR ct.start_time IS NULL
      OR (ct.start_time, COALESCE(ct.end_time, ct.start_time)) OVERLAPS (p_start_time, COALESCE(p_end_time, p_start_time))
    )
  ORDER BY ct.start_date, ct.start_time;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_driver_task_conflicts IS 'Check if driver has conflicting tasks in given date/time range';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE crew_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins full access
CREATE POLICY crew_tasks_admin_all ON crew_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role IN ('admin', 'super_admin', 'dispatcher')
    )
  );

-- Policy: Allow drivers to view their own tasks
CREATE POLICY crew_tasks_driver_view_own ON crew_tasks
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample charter task (3-day, 4 hours/day)
-- Uncomment to create sample data:
/*
INSERT INTO crew_tasks (
  task_number,
  task_type,
  task_status,
  driver_id,
  start_date,
  end_date,
  start_time,
  hours_per_day,
  total_hours,
  title,
  description,
  location,
  customer_name
) VALUES (
  3,
  'charter',
  'confirmed',
  (SELECT id FROM drivers WHERE first_name = 'Jonathan' LIMIT 1),
  '2025-10-04',
  '2025-10-06',
  '16:00',
  4.0,
  12.0,
  'Charter Services',
  '3-day charter service for corporate client',
  'Tokyo City Center',
  'ABC Corporation'
);
*/

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON crew_tasks TO authenticated;
GRANT SELECT ON crew_task_schedule_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_crew_task_schedule TO authenticated;
GRANT EXECUTE ON FUNCTION check_driver_task_conflicts TO authenticated;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_tasks') THEN
    RAISE NOTICE '✅ crew_tasks table created successfully';
  ELSE
    RAISE EXCEPTION '❌ crew_tasks table creation failed';
  END IF;
END $$;


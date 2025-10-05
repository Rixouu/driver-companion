-- =============================================================================
-- CREATE DRIVER CAPACITY SETTINGS TABLE
-- =============================================================================
-- This migration creates a table to store driver capacity settings including
-- max hours per day/week/month, preferred working times, and working days

-- Create driver_capacity_settings table
CREATE TABLE IF NOT EXISTS driver_capacity_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  
  -- Capacity Limits
  max_hours_per_day INTEGER NOT NULL DEFAULT 8 CHECK (max_hours_per_day > 0 AND max_hours_per_day <= 24),
  max_hours_per_week INTEGER NOT NULL DEFAULT 40 CHECK (max_hours_per_week > 0 AND max_hours_per_week <= 168),
  max_hours_per_month INTEGER NOT NULL DEFAULT 160 CHECK (max_hours_per_month > 0 AND max_hours_per_month <= 720),
  
  -- Preferred Working Times
  preferred_start_time TIME DEFAULT '09:00',
  preferred_end_time TIME DEFAULT '17:00',
  
  -- Working Days (stored as JSON array of day names)
  working_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (preferred_end_time > preferred_start_time),
  CONSTRAINT valid_working_days CHECK (jsonb_typeof(working_days) = 'array'),
  UNIQUE(driver_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_capacity_settings_driver_id ON driver_capacity_settings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_capacity_settings_active ON driver_capacity_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_driver_capacity_settings_working_days ON driver_capacity_settings USING GIN(working_days);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_capacity_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_driver_capacity_settings_updated_at
  BEFORE UPDATE ON driver_capacity_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_capacity_settings_updated_at();

-- Insert default capacity settings for existing drivers
INSERT INTO driver_capacity_settings (
  driver_id,
  max_hours_per_day,
  max_hours_per_week,
  max_hours_per_month,
  preferred_start_time,
  preferred_end_time,
  working_days,
  is_active
)
SELECT 
  d.id,
  8,
  40,
  160,
  '09:00',
  '17:00',
  '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  true
FROM drivers d
WHERE NOT EXISTS (
  SELECT 1 FROM driver_capacity_settings dcs WHERE dcs.driver_id = d.id
);

-- Create view for easy access to driver capacity data
CREATE OR REPLACE VIEW driver_capacity_view AS
SELECT 
  dcs.id,
  dcs.driver_id,
  d.first_name,
  d.last_name,
  d.email,
  dcs.max_hours_per_day,
  dcs.max_hours_per_week,
  dcs.max_hours_per_month,
  dcs.preferred_start_time,
  dcs.preferred_end_time,
  dcs.working_days,
  dcs.is_active,
  dcs.created_at,
  dcs.updated_at
FROM driver_capacity_settings dcs
JOIN drivers d ON d.id = dcs.driver_id
WHERE dcs.is_active = true;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON driver_capacity_settings TO authenticated;
GRANT SELECT ON driver_capacity_view TO authenticated;

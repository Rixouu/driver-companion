-- Create vehicle_assignments table
CREATE TABLE vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_vehicle_assignments_vehicle_id ON vehicle_assignments (vehicle_id);
CREATE INDEX idx_vehicle_assignments_driver_id ON vehicle_assignments (driver_id);
CREATE INDEX idx_vehicle_assignments_status ON vehicle_assignments (status);

-- Create constraint to ensure only one active assignment per vehicle
CREATE UNIQUE INDEX idx_unique_active_vehicle_assignment 
ON vehicle_assignments (vehicle_id) 
WHERE status = 'active';

COMMENT ON TABLE vehicle_assignments IS 'Tracks assignment history between vehicles and drivers';
COMMENT ON COLUMN vehicle_assignments.vehicle_id IS 'The assigned vehicle';
COMMENT ON COLUMN vehicle_assignments.driver_id IS 'The assigned driver';
COMMENT ON COLUMN vehicle_assignments.status IS 'Status of the assignment: active or inactive';
COMMENT ON COLUMN vehicle_assignments.start_date IS 'When the assignment began';
COMMENT ON COLUMN vehicle_assignments.end_date IS 'When the assignment ended (if not active)';
COMMENT ON COLUMN vehicle_assignments.notes IS 'Optional notes about the assignment'; 
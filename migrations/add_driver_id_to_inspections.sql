-- Add driver_id column to inspections table
ALTER TABLE inspections
ADD COLUMN driver_id UUID REFERENCES drivers(id) NULL;

-- Create index on driver_id for better query performance
CREATE INDEX idx_inspections_driver_id ON inspections (driver_id);

COMMENT ON COLUMN inspections.driver_id IS 'The driver associated with this inspection if applicable'; 
-- Create the inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES inspection_templates(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'canceled')),
  inspector_id UUID NOT NULL REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS inspections_template_id_idx ON inspections(template_id);
CREATE INDEX IF NOT EXISTS inspections_vehicle_id_idx ON inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS inspections_status_idx ON inspections(status);
CREATE INDEX IF NOT EXISTS inspections_inspector_id_idx ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS inspections_completed_at_idx ON inspections(completed_at);

-- Enable row-level security
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY inspections_select_policy ON inspections 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY inspections_insert_policy ON inspections 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY inspections_update_policy ON inspections 
  FOR UPDATE USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger to update the updated_at field
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON inspections
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 
-- Create the inspection_templates table
CREATE TABLE IF NOT EXISTS inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (title, deleted_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS inspection_templates_title_idx ON inspection_templates(title);
CREATE INDEX IF NOT EXISTS inspection_templates_status_idx ON inspection_templates(status);
CREATE INDEX IF NOT EXISTS inspection_templates_vehicle_type_id_idx ON inspection_templates(vehicle_type_id);
CREATE INDEX IF NOT EXISTS inspection_templates_created_by_idx ON inspection_templates(created_by);

-- Enable row-level security
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY inspection_templates_select_policy ON inspection_templates 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY inspection_templates_insert_policy ON inspection_templates 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY inspection_templates_update_policy ON inspection_templates 
  FOR UPDATE USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger to update the updated_at field
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON inspection_templates
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 
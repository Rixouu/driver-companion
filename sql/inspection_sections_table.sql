-- Create the inspection_sections table
CREATE TABLE IF NOT EXISTS inspection_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES inspection_templates(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (template_id, title, deleted_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS inspection_sections_template_id_idx ON inspection_sections(template_id);
CREATE INDEX IF NOT EXISTS inspection_sections_order_index_idx ON inspection_sections(order_index);

-- Enable row-level security
ALTER TABLE inspection_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY inspection_sections_select_policy ON inspection_sections 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY inspection_sections_insert_policy ON inspection_sections 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY inspection_sections_update_policy ON inspection_sections 
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
BEFORE UPDATE ON inspection_sections
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 
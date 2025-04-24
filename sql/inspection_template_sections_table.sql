-- Create inspection_template_sections table
CREATE TABLE IF NOT EXISTS inspection_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES inspection_templates(id),
  section_id UUID NOT NULL REFERENCES inspection_sections(id),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster querying
CREATE INDEX inspection_template_sections_template_id_idx ON inspection_template_sections(template_id);
CREATE INDEX inspection_template_sections_section_id_idx ON inspection_template_sections(section_id);
CREATE INDEX inspection_template_sections_sort_order_idx ON inspection_template_sections(sort_order);

-- Add unique constraint to prevent duplicate sections in a template
CREATE UNIQUE INDEX inspection_template_sections_unique_idx 
  ON inspection_template_sections(template_id, section_id) 
  WHERE deleted_at IS NULL;

-- Add RLS policies
ALTER TABLE inspection_template_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to select inspection_template_sections" 
ON inspection_template_sections FOR SELECT 
TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY "Allow authenticated users to insert inspection_template_sections" 
ON inspection_template_sections FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update inspection_template_sections" 
ON inspection_template_sections FOR UPDATE 
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER set_inspection_template_sections_updated_at
BEFORE UPDATE ON inspection_template_sections
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at(); 
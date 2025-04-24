-- Create the inspection_items table
CREATE TABLE IF NOT EXISTS inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES inspection_sections(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL DEFAULT 'pass_fail' CHECK (item_type IN ('pass_fail', 'numeric', 'text', 'multiple_choice')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  options JSONB, -- For multiple_choice type, stores the available options
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (section_id, title, deleted_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS inspection_items_section_id_idx ON inspection_items(section_id);
CREATE INDEX IF NOT EXISTS inspection_items_order_index_idx ON inspection_items(order_index);
CREATE INDEX IF NOT EXISTS inspection_items_item_type_idx ON inspection_items(item_type);
CREATE INDEX IF NOT EXISTS inspection_items_is_required_idx ON inspection_items(is_required);

-- Enable row-level security
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY inspection_items_select_policy ON inspection_items 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY inspection_items_insert_policy ON inspection_items 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY inspection_items_update_policy ON inspection_items 
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
BEFORE UPDATE ON inspection_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 
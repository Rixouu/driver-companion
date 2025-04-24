-- Create the inspection_item_results table
CREATE TABLE IF NOT EXISTS inspection_item_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inspection_items(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail', 'not_applicable')),
  value TEXT, -- For numeric, text, or multiple_choice responses
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(inspection_id, item_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS inspection_item_results_inspection_id_idx ON inspection_item_results(inspection_id);
CREATE INDEX IF NOT EXISTS inspection_item_results_item_id_idx ON inspection_item_results(item_id);
CREATE INDEX IF NOT EXISTS inspection_item_results_status_idx ON inspection_item_results(status);
CREATE INDEX IF NOT EXISTS inspection_item_results_created_by_idx ON inspection_item_results(created_by);

-- Enable row-level security
ALTER TABLE inspection_item_results ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY inspection_item_results_select_policy ON inspection_item_results 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY inspection_item_results_insert_policy ON inspection_item_results 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY inspection_item_results_update_policy ON inspection_item_results 
  FOR UPDATE USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger to update the updated_at field
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON inspection_item_results
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 
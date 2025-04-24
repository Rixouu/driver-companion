-- Create the inspection_results table
CREATE TABLE IF NOT EXISTS inspection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inspection_items(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'pass', 'fail', 'not_applicable')),
  notes TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create a unique constraint to ensure one result per item per inspection
CREATE UNIQUE INDEX IF NOT EXISTS inspection_results_inspection_item_idx 
  ON inspection_results(inspection_id, item_id) 
  WHERE deleted_at IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS inspection_results_inspection_id_idx ON inspection_results(inspection_id);
CREATE INDEX IF NOT EXISTS inspection_results_item_id_idx ON inspection_results(item_id);
CREATE INDEX IF NOT EXISTS inspection_results_status_idx ON inspection_results(status);
CREATE INDEX IF NOT EXISTS inspection_results_created_at_idx ON inspection_results(created_at);

-- Enable row-level security
ALTER TABLE inspection_results ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY inspection_results_select_policy ON inspection_results 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY inspection_results_insert_policy ON inspection_results 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY inspection_results_update_policy ON inspection_results 
  FOR UPDATE USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger to update the updated_at field
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON inspection_results
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 
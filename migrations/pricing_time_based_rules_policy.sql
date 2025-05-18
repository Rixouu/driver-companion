-- Enable Row Level Security
ALTER TABLE pricing_time_based_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read time based pricing rules"
  ON pricing_time_based_rules
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert time based pricing rules"
  ON pricing_time_based_rules
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update time based pricing rules"
  ON pricing_time_based_rules
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete time based pricing rules"
  ON pricing_time_based_rules
  FOR DELETE
  USING (true);

-- Once the admin_users table is created, switch to these policies:
/*
CREATE POLICY "Admin users can read time based pricing rules"
  ON pricing_time_based_rules
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin')
  );

CREATE POLICY "Admin users can insert time based pricing rules"
  ON pricing_time_based_rules
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin')
  );

CREATE POLICY "Admin users can update time based pricing rules"
  ON pricing_time_based_rules
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin')
  );

CREATE POLICY "Admin users can delete time based pricing rules"
  ON pricing_time_based_rules
  FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin')
  );
*/ 
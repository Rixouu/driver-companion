-- Create generated_reports table
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  format VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'generating',
  file_size INTEGER,
  download_url TEXT,
  date_range JSONB,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report_schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  format VARCHAR(10) NOT NULL DEFAULT 'pdf',
  frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
  day_of_week INTEGER, -- 0-6 for weekly (0 = Sunday)
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME, -- HH:MM format
  is_active BOOLEAN DEFAULT true,
  options JSONB,
  recipients JSONB, -- email addresses
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report_settings table
CREATE TABLE IF NOT EXISTS report_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  default_format VARCHAR(10) DEFAULT 'pdf',
  default_sections JSONB,
  email_notifications BOOLEAN DEFAULT true,
  auto_generate BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_by ON generated_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_report_schedules_created_by ON report_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run);

-- Enable Row Level Security
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reports" ON generated_reports
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own reports" ON generated_reports
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own reports" ON generated_reports
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own reports" ON generated_reports
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own schedules" ON report_schedules
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own schedules" ON report_schedules
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own schedules" ON report_schedules
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own schedules" ON report_schedules
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own settings" ON report_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON report_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON report_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run(
  frequency VARCHAR(20),
  day_of_week INTEGER DEFAULT NULL,
  day_of_month INTEGER DEFAULT NULL,
  time_of_day TIME DEFAULT '09:00'
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  CASE frequency
    WHEN 'daily' THEN
      next_run := (current_time::DATE + INTERVAL '1 day' + time_of_day)::TIMESTAMP WITH TIME ZONE;
    WHEN 'weekly' THEN
      next_run := (current_time::DATE + INTERVAL '1 week' + (day_of_week || ' days')::INTERVAL + time_of_day)::TIMESTAMP WITH TIME ZONE;
    WHEN 'monthly' THEN
      next_run := (current_time::DATE + INTERVAL '1 month' + (day_of_month || ' days')::INTERVAL + time_of_day)::TIMESTAMP WITH TIME ZONE;
    WHEN 'quarterly' THEN
      next_run := (current_time::DATE + INTERVAL '3 months' + (day_of_month || ' days')::INTERVAL + time_of_day)::TIMESTAMP WITH TIME ZONE;
    ELSE
      next_run := current_time + INTERVAL '1 day';
  END CASE;
  
  RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_reports_updated_at
  BEFORE UPDATE ON generated_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_settings_updated_at
  BEFORE UPDATE ON report_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

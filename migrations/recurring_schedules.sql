-- Create maintenance_schedules table
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'biannually', 'annually', 'custom')),
  interval_days INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  last_generated_date DATE,
  template_id UUID REFERENCES public.maintenance_task_templates(id) ON DELETE SET NULL,
  estimated_duration NUMERIC,
  estimated_cost NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  notes TEXT,
  
  CONSTRAINT check_interval_days CHECK (
    (frequency = 'custom' AND interval_days IS NOT NULL) OR
    (frequency != 'custom')
  )
);

-- Create inspection_schedules table
CREATE TABLE IF NOT EXISTS public.inspection_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('routine', 'safety', 'maintenance')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'biannually', 'annually', 'custom')),
  interval_days INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  last_generated_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  notes TEXT,
  
  CONSTRAINT check_interval_days CHECK (
    (frequency = 'custom' AND interval_days IS NOT NULL) OR
    (frequency != 'custom')
  )
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'inspection', 'system')),
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE
);

-- Create RLS policies
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for maintenance_schedules
CREATE POLICY "Users can view their own maintenance schedules" 
  ON public.maintenance_schedules 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenance schedules" 
  ON public.maintenance_schedules 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance schedules" 
  ON public.maintenance_schedules 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenance schedules" 
  ON public.maintenance_schedules 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create policy for inspection_schedules
CREATE POLICY "Users can view their own inspection schedules" 
  ON public.inspection_schedules 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspection schedules" 
  ON public.inspection_schedules 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspection schedules" 
  ON public.inspection_schedules 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspection schedules" 
  ON public.inspection_schedules 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create policy for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS maintenance_schedules_vehicle_id_idx ON public.maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS maintenance_schedules_user_id_idx ON public.maintenance_schedules(user_id);
CREATE INDEX IF NOT EXISTS maintenance_schedules_is_active_idx ON public.maintenance_schedules(is_active);

CREATE INDEX IF NOT EXISTS inspection_schedules_vehicle_id_idx ON public.inspection_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS inspection_schedules_user_id_idx ON public.inspection_schedules(user_id);
CREATE INDEX IF NOT EXISTS inspection_schedules_is_active_idx ON public.inspection_schedules(is_active);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_maintenance_schedules_updated_at
BEFORE UPDATE ON public.maintenance_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_schedules_updated_at
BEFORE UPDATE ON public.inspection_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 
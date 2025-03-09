-- Create maintenance_task_templates table
CREATE TABLE IF NOT EXISTS public.maintenance_task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_duration NUMERIC NOT NULL,
  estimated_cost NUMERIC NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE public.maintenance_task_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read templates
CREATE POLICY "Allow authenticated users to read templates" 
  ON public.maintenance_task_templates 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policy for service role to manage templates
CREATE POLICY "Allow service role to manage templates" 
  ON public.maintenance_task_templates 
  FOR ALL 
  TO service_role 
  USING (true);

-- Insert sample data
INSERT INTO public.maintenance_task_templates (title, description, category, estimated_duration, estimated_cost, priority)
VALUES
  -- Engine Maintenance
  ('Oil Change', 'Regular oil change with filter replacement', 'Engine Maintenance', 1, 50, 'medium'),
  ('Air Filter Replacement', 'Replace engine air filter', 'Engine Maintenance', 0.5, 25, 'low'),
  ('Spark Plug Replacement', 'Replace and gap spark plugs', 'Engine Maintenance', 1.5, 60, 'medium'),
  ('Timing Belt Replacement', 'Replace timing belt and inspect related components', 'Engine Maintenance', 3, 350, 'high'),
  ('Fuel Filter Replacement', 'Replace fuel filter', 'Engine Maintenance', 1, 40, 'medium'),
  
  -- Brake System
  ('Brake Pad Replacement', 'Replace front and rear brake pads', 'Brake System', 2, 150, 'high'),
  ('Brake Fluid Flush', 'Flush and replace brake fluid', 'Brake System', 1, 80, 'medium'),
  ('Brake Rotor Replacement', 'Replace worn brake rotors', 'Brake System', 2.5, 200, 'high'),
  ('Brake Caliper Service', 'Clean and service brake calipers', 'Brake System', 2, 120, 'medium'),
  
  -- Transmission
  ('Transmission Fluid Change', 'Drain and replace transmission fluid', 'Transmission', 1.5, 100, 'medium'),
  ('Transmission Filter Replacement', 'Replace transmission filter', 'Transmission', 2, 120, 'medium'),
  ('Clutch Replacement', 'Replace clutch assembly', 'Transmission', 4, 500, 'high'),
  
  -- Cooling System
  ('Coolant Flush', 'Flush and replace engine coolant', 'Cooling System', 1, 70, 'medium'),
  ('Radiator Replacement', 'Replace radiator', 'Cooling System', 2.5, 250, 'high'),
  ('Thermostat Replacement', 'Replace thermostat', 'Cooling System', 1, 60, 'medium'),
  ('Water Pump Replacement', 'Replace water pump', 'Cooling System', 2.5, 200, 'high'),
  
  -- Suspension & Steering
  ('Wheel Alignment', 'Perform four-wheel alignment', 'Suspension & Steering', 1, 80, 'medium'),
  ('Shock/Strut Replacement', 'Replace shock absorbers or struts', 'Suspension & Steering', 3, 350, 'high'),
  ('Ball Joint Replacement', 'Replace worn ball joints', 'Suspension & Steering', 2.5, 200, 'high'),
  ('Tie Rod End Replacement', 'Replace tie rod ends', 'Suspension & Steering', 2, 150, 'medium'),
  ('Control Arm Replacement', 'Replace control arms and bushings', 'Suspension & Steering', 2.5, 250, 'high'),
  
  -- Electrical System
  ('Battery Replacement', 'Replace vehicle battery', 'Electrical System', 0.5, 120, 'high'),
  ('Alternator Replacement', 'Replace alternator', 'Electrical System', 2, 300, 'high'),
  ('Starter Replacement', 'Replace starter motor', 'Electrical System', 1.5, 250, 'high'),
  ('Headlight Bulb Replacement', 'Replace headlight bulbs', 'Electrical System', 0.5, 30, 'medium'),
  
  -- Tires
  ('Tire Rotation', 'Rotate tires to ensure even wear', 'Tires', 0.5, 30, 'low'),
  ('Tire Replacement', 'Replace all four tires', 'Tires', 1, 400, 'high'),
  ('Tire Balancing', 'Balance all tires', 'Tires', 1, 60, 'medium'),
  
  -- HVAC System
  ('Cabin Air Filter Replacement', 'Replace cabin air filter', 'HVAC System', 0.5, 30, 'low'),
  ('AC Recharge', 'Recharge air conditioning system', 'HVAC System', 1, 100, 'medium'),
  ('Heater Core Replacement', 'Replace heater core', 'HVAC System', 4, 400, 'high'),
  
  -- Scheduled Maintenance
  ('30,000 Mile Service', 'Comprehensive service at 30,000 miles', 'Scheduled Maintenance', 3, 350, 'medium'),
  ('60,000 Mile Service', 'Comprehensive service at 60,000 miles', 'Scheduled Maintenance', 4, 450, 'medium'),
  ('90,000 Mile Service', 'Comprehensive service at 90,000 miles', 'Scheduled Maintenance', 5, 550, 'high'); 
-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  registration_expiry TIMESTAMP WITH TIME ZONE,
  mileage INTEGER,
  fuel_type TEXT,
  status TEXT DEFAULT 'active',
  type TEXT,
  color TEXT,
  capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to select vehicles" 
ON vehicles FOR SELECT 
TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY "Allow authenticated users to insert vehicles" 
ON vehicles FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update vehicles" 
ON vehicles FOR UPDATE 
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER set_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at(); 
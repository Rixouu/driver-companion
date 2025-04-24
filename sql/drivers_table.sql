-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  license_number TEXT,
  license_expiry TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  address TEXT,
  emergency_contact TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to select drivers" 
ON drivers FOR SELECT 
TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY "Allow authenticated users to insert drivers" 
ON drivers FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update drivers" 
ON drivers FOR UPDATE 
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);

-- Create indexes for faster searching
CREATE INDEX drivers_status_idx ON drivers(status);
CREATE INDEX drivers_name_idx ON drivers(first_name, last_name);
CREATE INDEX drivers_email_idx ON drivers(email);
CREATE INDEX drivers_license_number_idx ON drivers(license_number);

-- Create function for handling updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON drivers
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at(); 
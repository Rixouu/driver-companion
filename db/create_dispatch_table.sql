-- Create the dispatch_entries table
CREATE TABLE IF NOT EXISTS public.dispatch_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'completed', 'cancelled')),
  notes TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create an index for faster lookups
CREATE INDEX idx_dispatch_entries_booking_id ON public.dispatch_entries(booking_id);
CREATE INDEX idx_dispatch_entries_driver_id ON public.dispatch_entries(driver_id);
CREATE INDEX idx_dispatch_entries_vehicle_id ON public.dispatch_entries(vehicle_id);
CREATE INDEX idx_dispatch_entries_status ON public.dispatch_entries(status);
CREATE INDEX idx_dispatch_entries_start_time ON public.dispatch_entries(start_time);

-- Add a function to automatically update updated_at on row update
CREATE OR REPLACE FUNCTION update_dispatch_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to call the function on row update
CREATE TRIGGER trigger_dispatch_entries_updated_at
BEFORE UPDATE ON public.dispatch_entries
FOR EACH ROW
EXECUTE FUNCTION update_dispatch_entries_updated_at();

-- Add RLS (Row Level Security) policies for dispatch_entries
ALTER TABLE public.dispatch_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users to select all rows
CREATE POLICY "Authenticated users can select dispatch_entries"
  ON public.dispatch_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy for authenticated users to insert dispatch_entries
CREATE POLICY "Authenticated users can insert dispatch_entries"
  ON public.dispatch_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create a policy for authenticated users to update dispatch_entries
CREATE POLICY "Authenticated users can update dispatch_entries"
  ON public.dispatch_entries
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create a policy for authenticated users to delete dispatch_entries
CREATE POLICY "Authenticated users can delete dispatch_entries"
  ON public.dispatch_entries
  FOR DELETE
  TO authenticated
  USING (true); 
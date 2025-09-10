-- Create table for tracking vehicle assignment operations (upgrades/downgrades)
CREATE TABLE IF NOT EXISTS vehicle_assignment_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('upgrade', 'downgrade', 'update')),
  
  -- Vehicle information
  previous_vehicle_id UUID REFERENCES vehicles(id),
  new_vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  previous_category_name TEXT,
  new_category_name TEXT,
  
  -- Driver information
  driver_id UUID NOT NULL REFERENCES drivers(id),
  
  -- Pricing information
  price_difference NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'JPY',
  
  -- Payment/Coupon information
  payment_link_id TEXT,
  payment_url TEXT,
  coupon_code TEXT,
  refund_amount NUMERIC,
  
  -- Email information
  customer_email TEXT,
  bcc_email TEXT,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_assignment_operations_booking_id ON vehicle_assignment_operations(booking_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignment_operations_operation_type ON vehicle_assignment_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignment_operations_status ON vehicle_assignment_operations(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignment_operations_coupon_code ON vehicle_assignment_operations(coupon_code) WHERE coupon_code IS NOT NULL;

-- Add RLS policies
ALTER TABLE vehicle_assignment_operations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own operations
CREATE POLICY "Users can view vehicle assignment operations for their bookings" ON vehicle_assignment_operations
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE created_by = auth.uid()
    )
  );

-- Policy for authenticated users to insert operations
CREATE POLICY "Users can create vehicle assignment operations for their bookings" ON vehicle_assignment_operations
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE created_by = auth.uid()
    )
  );

-- Policy for authenticated users to update their operations
CREATE POLICY "Users can update vehicle assignment operations for their bookings" ON vehicle_assignment_operations
  FOR UPDATE USING (
    booking_id IN (
      SELECT id FROM bookings WHERE created_by = auth.uid()
    )
  );

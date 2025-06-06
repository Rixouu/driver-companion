-- Add tracking tables for dispatch system with real-time location tracking

-- Table for tracking devices (OwnTracks integration)
CREATE TABLE IF NOT EXISTS tracking_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ,
    battery_level INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for real-time vehicle locations
CREATE TABLE IF NOT EXISTS vehicle_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(8, 2),
    accuracy DECIMAL(8, 2),
    speed DECIMAL(8, 2),
    bearing DECIMAL(5, 2),
    timestamp TIMESTAMPTZ NOT NULL,
    battery_level INTEGER,
    is_moving BOOLEAN DEFAULT false,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT vehicle_locations_device_id_fkey 
        FOREIGN KEY (device_id) REFERENCES tracking_devices(device_id)
);

-- Enhanced dispatch assignments table
CREATE TABLE IF NOT EXISTS dispatch_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'confirmed', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    pickup_location JSONB,
    dropoff_location JSONB,
    route_data JSONB,
    distance_km DECIMAL(8, 2),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    notes TEXT,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for dispatch notifications and updates
CREATE TABLE IF NOT EXISTS dispatch_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES dispatch_assignments(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_for UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_device_timestamp ON vehicle_locations(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id ON vehicle_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_timestamp ON vehicle_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_booking ON dispatch_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_driver ON dispatch_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_vehicle ON dispatch_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_status ON dispatch_assignments(status);
CREATE INDEX IF NOT EXISTS idx_tracking_devices_vehicle ON tracking_devices(vehicle_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tracking_devices_updated_at BEFORE UPDATE ON tracking_devices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_dispatch_assignments_updated_at BEFORE UPDATE ON dispatch_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS policies
ALTER TABLE tracking_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all tracking data
CREATE POLICY "Allow authenticated read access to tracking_devices" ON tracking_devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to vehicle_locations" ON vehicle_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access to dispatch_assignments" ON dispatch_assignments FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update dispatch data
CREATE POLICY "Allow authenticated insert to tracking_devices" ON tracking_devices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update to tracking_devices" ON tracking_devices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert to vehicle_locations" ON vehicle_locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert to dispatch_assignments" ON dispatch_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update to dispatch_assignments" ON dispatch_assignments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert to dispatch_notifications" ON dispatch_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update to dispatch_notifications" ON dispatch_notifications FOR UPDATE TO authenticated USING (true); 
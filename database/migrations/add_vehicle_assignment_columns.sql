-- Add vehicle assignment tracking columns to bookings table
ALTER TABLE bookings 
ADD COLUMN previous_vehicle_id UUID REFERENCES vehicles(id),
ADD COLUMN new_vehicle_id UUID REFERENCES vehicles(id);

-- Add indexes for better performance
CREATE INDEX idx_bookings_previous_vehicle_id ON bookings(previous_vehicle_id);
CREATE INDEX idx_bookings_new_vehicle_id ON bookings(new_vehicle_id);

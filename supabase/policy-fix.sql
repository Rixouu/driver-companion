-- Drop conflicting policies for bookings if they exist
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

-- Create a policy to allow authenticated users to view all bookings
CREATE POLICY "Allow authenticated users to view all bookings" 
ON public.bookings
FOR SELECT 
TO authenticated
USING (true);

-- Enable all operations on bookings for authenticated users
CREATE POLICY "Allow authenticated users to manage bookings"
ON public.bookings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for driver_availability if they don't exist
DROP POLICY IF EXISTS "Users can view driver availability" ON public.driver_availability;
CREATE POLICY "Allow authenticated users to view driver availability"
ON public.driver_availability
FOR SELECT
TO authenticated
USING (true);

-- Enable all operations on driver_availability for authenticated users
CREATE POLICY "Allow authenticated users to manage driver availability"
ON public.driver_availability
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for vehicle_assignments if they don't exist
DROP POLICY IF EXISTS "Users can view vehicle assignments" ON public.vehicle_assignments;
CREATE POLICY "Allow authenticated users to view vehicle assignments"
ON public.vehicle_assignments
FOR SELECT
TO authenticated
USING (true);

-- Enable all operations on vehicle_assignments for authenticated users
CREATE POLICY "Allow authenticated users to manage vehicle assignments"
ON public.vehicle_assignments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true); 
-- Enhanced Assignment System Database Queries

-- 1. Get comprehensive booking data with availability status
CREATE OR REPLACE VIEW assignment_bookings AS
SELECT 
  b.*,
  d.first_name as driver_first_name,
  d.last_name as driver_last_name,
  d.email as driver_email,
  d.phone as driver_phone,
  d.profile_image_url as driver_image,
  d.availability_status as driver_availability,
  v.name as vehicle_name,
  v.plate_number,
  v.brand as vehicle_brand,
  v.model as vehicle_model,
  v.year as vehicle_year,
  v.image_url as vehicle_image,
  v.status as vehicle_status,
  CASE 
    WHEN b.driver_id IS NOT NULL AND b.vehicle_id IS NOT NULL THEN 'fully_assigned'
    WHEN b.driver_id IS NOT NULL OR b.vehicle_id IS NOT NULL THEN 'partially_assigned'
    ELSE 'unassigned'
  END as assignment_status
FROM bookings b
LEFT JOIN drivers d ON b.driver_id = d.id
LEFT JOIN vehicles v ON b.vehicle_id = v.id
WHERE b.status IN ('pending', 'confirmed', 'publish')
ORDER BY b.date ASC, b.time ASC;

-- 2. Get available drivers with performance metrics
CREATE OR REPLACE VIEW available_drivers_enhanced AS
SELECT 
  d.*,
  CASE 
    WHEN da.status IS NULL OR da.status = 'available' THEN true
    ELSE false
  END as is_available,
  da.end_date as next_available_time,
  -- Mock performance metrics (you can replace with real data)
  (4.0 + (RANDOM() * 1.0))::NUMERIC(2,1) as rating,
  (1 + (RANDOM() * 10)::INT) as experience_years,
  (5 + (RANDOM() * 25)::INT) as estimated_travel_time_minutes
FROM drivers d
LEFT JOIN LATERAL (
  SELECT status, end_date 
  FROM driver_availability 
  WHERE driver_id = d.id 
    AND start_date <= NOW() 
    AND (end_date >= NOW() OR end_date IS NULL)
  ORDER BY created_at DESC 
  LIMIT 1
) da ON true
WHERE d.deleted_at IS NULL;

-- 3. Get available vehicles with status
CREATE OR REPLACE VIEW available_vehicles_enhanced AS
SELECT 
  v.*,
  CASE 
    WHEN v.status = 'active' AND va.vehicle_id IS NULL THEN true
    ELSE false
  END as is_available,
  -- Mock fuel level (replace with real sensor data)
  (60 + (RANDOM() * 40)::INT) as fuel_level,
  -- Mock location (replace with real GPS data)
  'Downtown Area' as current_location
FROM vehicles v
LEFT JOIN (
  SELECT DISTINCT vehicle_id 
  FROM vehicle_assignments 
  WHERE status = 'active'
    AND (end_date IS NULL OR end_date >= NOW())
) va ON v.id = va.vehicle_id
WHERE v.status != 'retired';

-- 4. Smart assignment scoring function
CREATE OR REPLACE FUNCTION get_driver_assignment_score(
  driver_id UUID,
  booking_date DATE,
  booking_time TIME,
  pickup_location TEXT
) RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
  driver_record RECORD;
  availability_score NUMERIC;
  experience_score NUMERIC;
  location_score NUMERIC;
BEGIN
  -- Get driver information
  SELECT * INTO driver_record 
  FROM available_drivers_enhanced 
  WHERE id = driver_id;
  
  IF NOT FOUND OR NOT driver_record.is_available THEN
    RETURN 0;
  END IF;
  
  -- Availability score (50% weight)
  availability_score := CASE 
    WHEN driver_record.is_available THEN 50
    ELSE 0
  END;
  
  -- Experience score (30% weight)
  experience_score := LEAST(driver_record.experience_years * 3, 30);
  
  -- Location/distance score (20% weight) - simplified
  location_score := 20 - (driver_record.estimated_travel_time_minutes * 0.5);
  location_score := GREATEST(location_score, 0);
  
  -- Total score
  score := availability_score + experience_score + location_score;
  
  RETURN GREATEST(score, 0);
END;
$$ LANGUAGE plpgsql;

-- 5. Get smart assignment recommendations
CREATE OR REPLACE FUNCTION get_smart_assignment_recommendations(
  booking_id UUID
) RETURNS TABLE(
  driver_id UUID,
  driver_name TEXT,
  driver_score NUMERIC,
  vehicle_id UUID,
  vehicle_info TEXT,
  compatibility_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH booking_info AS (
    SELECT date, time, pickup_location 
    FROM bookings 
    WHERE id = booking_id
  ),
  driver_scores AS (
    SELECT 
      d.id as driver_id,
      d.first_name || ' ' || d.last_name as driver_name,
      get_driver_assignment_score(d.id, b.date, b.time, b.pickup_location) as score
    FROM available_drivers_enhanced d
    CROSS JOIN booking_info b
    WHERE d.is_available = true
  ),
  vehicle_options AS (
    SELECT 
      v.id as vehicle_id,
      v.plate_number || ' - ' || v.brand || ' ' || v.model as vehicle_info,
      (v.fuel_level + (CASE WHEN v.status = 'active' THEN 20 ELSE 0 END)) as compatibility
    FROM available_vehicles_enhanced v
    WHERE v.is_available = true
  )
  SELECT 
    ds.driver_id,
    ds.driver_name,
    ds.score,
    vo.vehicle_id,
    vo.vehicle_info,
    vo.compatibility
  FROM driver_scores ds
  CROSS JOIN vehicle_options vo
  WHERE ds.score > 0
  ORDER BY ds.score DESC, vo.compatibility DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 6. Create assignment with notification tracking
CREATE OR REPLACE FUNCTION create_assignment_with_notifications(
  p_booking_id UUID,
  p_driver_id UUID,
  p_vehicle_id UUID,
  p_notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb
) RETURNS UUID AS $$
DECLARE
  assignment_id UUID;
  booking_record RECORD;
BEGIN
  -- Get booking information
  SELECT * INTO booking_record FROM bookings WHERE id = p_booking_id;
  
  -- Update booking with assignments
  UPDATE bookings 
  SET 
    driver_id = p_driver_id,
    vehicle_id = p_vehicle_id,
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- Create or update dispatch entry
  INSERT INTO dispatch_entries (
    id,
    booking_id,
    driver_id,
    vehicle_id,
    status,
    start_time,
    end_time,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_booking_id,
    p_driver_id,
    p_vehicle_id,
    'assigned',
    (booking_record.date || ' ' || booking_record.time)::timestamp,
    (booking_record.date || ' ' || booking_record.time)::timestamp + interval '2 hours',
    NOW(),
    NOW()
  )
  ON CONFLICT (booking_id) 
  DO UPDATE SET
    driver_id = p_driver_id,
    vehicle_id = p_vehicle_id,
    status = 'assigned',
    updated_at = NOW()
  RETURNING id INTO assignment_id;
  
  -- Log notification preferences (you can create a notifications table)
  -- INSERT INTO assignment_notifications (assignment_id, settings, created_at)
  -- VALUES (assignment_id, p_notification_settings, NOW());
  
  RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Get assignment statistics for dashboard
CREATE OR REPLACE VIEW assignment_statistics AS
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN assignment_status = 'fully_assigned' THEN 1 END) as fully_assigned,
  COUNT(CASE WHEN assignment_status = 'partially_assigned' THEN 1 END) as partially_assigned,
  COUNT(CASE WHEN assignment_status = 'unassigned' THEN 1 END) as unassigned,
  (COUNT(CASE WHEN d.is_available THEN 1 END)) as available_drivers,
  (SELECT COUNT(*) FROM available_drivers_enhanced) as total_drivers,
  (COUNT(CASE WHEN v.is_available THEN 1 END)) as available_vehicles,
  (SELECT COUNT(*) FROM available_vehicles_enhanced WHERE status = 'active') as total_vehicles
FROM assignment_bookings ab
LEFT JOIN available_drivers_enhanced d ON ab.driver_id = d.id
LEFT JOIN available_vehicles_enhanced v ON ab.vehicle_id = v.id;

-- 8. Search bookings with advanced filters
CREATE OR REPLACE FUNCTION search_bookings_for_assignment(
  p_search_term TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_assignment_filter TEXT DEFAULT 'all',
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
) RETURNS TABLE(
  booking_id UUID,
  wp_id TEXT,
  customer_name TEXT,
  service_name TEXT,
  booking_date DATE,
  booking_time TIME,
  pickup_location TEXT,
  status TEXT,
  assignment_status TEXT,
  driver_name TEXT,
  vehicle_info TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ab.id,
    ab.wp_id,
    ab.customer_name,
    ab.service_name,
    ab.date,
    ab.time,
    ab.pickup_location,
    ab.status,
    ab.assignment_status,
    CASE 
      WHEN ab.driver_first_name IS NOT NULL 
      THEN ab.driver_first_name || ' ' || ab.driver_last_name
      ELSE NULL 
    END,
    CASE 
      WHEN ab.vehicle_name IS NOT NULL 
      THEN ab.plate_number || ' - ' || ab.vehicle_brand || ' ' || ab.vehicle_model
      ELSE NULL 
    END
  FROM assignment_bookings ab
  WHERE 
    (p_search_term IS NULL OR (
      ab.customer_name ILIKE '%' || p_search_term || '%' OR
      ab.wp_id ILIKE '%' || p_search_term || '%' OR
      ab.id::text ILIKE '%' || p_search_term || '%'
    ))
    AND (p_status_filter = 'all' OR ab.status = p_status_filter)
    AND (p_assignment_filter = 'all' OR ab.assignment_status = p_assignment_filter)
    AND (p_date_from IS NULL OR ab.date >= p_date_from)
    AND (p_date_to IS NULL OR ab.date <= p_date_to)
  ORDER BY ab.date ASC, ab.time ASC;
END;
$$ LANGUAGE plpgsql;

-- 9. Update driver availability automatically after assignment
CREATE OR REPLACE FUNCTION update_driver_availability_after_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking is assigned to a driver, mark them as unavailable for that time
  IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN
    INSERT INTO driver_availability (
      driver_id,
      start_date,
      end_date,
      status,
      notes,
      created_at
    ) VALUES (
      NEW.driver_id,
      (NEW.date || ' ' || NEW.time)::timestamp,
      (NEW.date || ' ' || NEW.time)::timestamp + interval '2 hours', -- Default 2 hour booking
      'unavailable',
      'Auto-created for booking #' || COALESCE(NEW.wp_id, NEW.id::text),
      NOW()
    )
    ON CONFLICT DO NOTHING; -- Avoid duplicates
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS booking_assignment_availability_trigger ON bookings;
CREATE TRIGGER booking_assignment_availability_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.driver_id IS DISTINCT FROM OLD.driver_id)
  EXECUTE FUNCTION update_driver_availability_after_assignment();

-- 10. Example usage queries

-- Get all available resources for assignment
/*
SELECT 
  (SELECT COUNT(*) FROM available_drivers_enhanced WHERE is_available = true) as available_drivers,
  (SELECT COUNT(*) FROM available_vehicles_enhanced WHERE is_available = true) as available_vehicles,
  (SELECT COUNT(*) FROM assignment_bookings WHERE assignment_status = 'unassigned') as unassigned_bookings;
*/

-- Get smart recommendations for a specific booking
/*
SELECT * FROM get_smart_assignment_recommendations('your-booking-id-here');
*/

-- Search bookings with filters
/*
SELECT * FROM search_bookings_for_assignment(
  p_search_term := 'john',
  p_assignment_filter := 'unassigned'
);
*/

-- Create an assignment with notifications
/*
SELECT create_assignment_with_notifications(
  p_booking_id := 'your-booking-id',
  p_driver_id := 'your-driver-id',
  p_vehicle_id := 'your-vehicle-id',
  p_notification_settings := '{"email": true, "push": true, "sms": false, "custom_message": "Assignment completed"}'::jsonb
);
*/ 
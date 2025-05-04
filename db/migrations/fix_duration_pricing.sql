-- Create a function to get the correct price from pricing_items based on duration_hours
CREATE OR REPLACE FUNCTION get_correct_price_for_duration(
  p_vehicle_type TEXT,
  p_service_type TEXT,
  p_duration_hours INTEGER
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  selected_price DECIMAL(10, 2);
  price_record RECORD;
  suitable_hours INTEGER := NULL;
  log_details JSONB;
BEGIN
  -- Find the closest matching duration that doesn't exceed the requested hours
  SELECT pi.price, pi.duration_hours
  INTO price_record
  FROM public.pricing_items pi
  WHERE pi.vehicle_type = p_vehicle_type
    AND pi.service_type = p_service_type
    AND pi.duration_hours <= p_duration_hours
    AND pi.is_active = TRUE
  ORDER BY pi.duration_hours DESC
  LIMIT 1;
  
  -- If nothing found, try the smallest available duration
  IF price_record IS NULL THEN
    SELECT pi.price, pi.duration_hours
    INTO price_record
    FROM public.pricing_items pi
    WHERE pi.vehicle_type = p_vehicle_type
      AND pi.service_type = p_service_type
      AND pi.is_active = TRUE
    ORDER BY pi.duration_hours ASC
    LIMIT 1;
  END IF;
  
  -- Build log details
  log_details := jsonb_build_object(
    'function', 'get_correct_price_for_duration',
    'vehicle_type', p_vehicle_type,
    'service_type', p_service_type,
    'requested_duration_hours', p_duration_hours,
    'matched_duration_hours', COALESCE(price_record.duration_hours, 'none'),
    'selected_price', COALESCE(price_record.price, 0)
  );
  
  -- Log the price selection
  INSERT INTO public.pricing_calculation_logs (
    function_name,
    service_type,
    duration_hours,
    base_price,
    calculation_details
  ) VALUES (
    'get_correct_price_for_duration',
    p_service_type,
    p_duration_hours,
    COALESCE(price_record.price, 0),
    log_details
  );
  
  RETURN COALESCE(price_record.price, 0);
END;
$$ LANGUAGE plpgsql;

-- Modify the quotations update function to ensure it uses the correct hourly price
CREATE OR REPLACE FUNCTION update_quotation_with_correct_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a charter service and duration_hours is set
  IF NEW.service_type = 'charter' AND NEW.duration_hours IS NOT NULL AND NEW.vehicle_type IS NOT NULL THEN
    -- Set the amount based on the pricing table
    NEW.amount := get_correct_price_for_duration(NEW.vehicle_type, NEW.service_type, NEW.duration_hours);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update amount when service, duration, or vehicle changes
CREATE OR REPLACE TRIGGER update_quotation_price_trigger
BEFORE INSERT OR UPDATE OF service_type, duration_hours, vehicle_type
ON public.quotations
FOR EACH ROW EXECUTE FUNCTION update_quotation_with_correct_price(); 
-- Modify the pricing_calculation_logs table to make quotation_id nullable
ALTER TABLE public.pricing_calculation_logs 
ALTER COLUMN quotation_id DROP NOT NULL;

-- Update the calculate_charter_price function to handle null quotation_id
CREATE OR REPLACE FUNCTION calculate_charter_price(
  base_price DECIMAL(10, 2),
  days_count INTEGER,
  quotation_id UUID DEFAULT NULL
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  result DECIMAL(10, 2);
BEGIN
  -- Calculate result
  result := base_price * COALESCE(days_count, 1);
  
  -- Only log if quotation_id is provided
  IF quotation_id IS NOT NULL THEN
    -- Log calculation
    INSERT INTO public.pricing_calculation_logs (
      quotation_id,
      function_name,
      base_price,
      days_count, 
      calculated_amount,
      calculation_details
    ) VALUES (
      quotation_id,
      'calculate_charter_price',
      base_price,
      days_count,
      result,
      jsonb_build_object(
        'base_price', base_price,
        'days_count', days_count,
        'formula', 'base_price * days_count',
        'result', result
      )
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the get_correct_price_for_duration function to handle null quotation_id
CREATE OR REPLACE FUNCTION get_correct_price_for_duration(
  p_vehicle_type TEXT,
  p_service_type TEXT,
  p_duration_hours INTEGER,
  p_quotation_id UUID DEFAULT NULL
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
  
  -- Only log if quotation_id is provided
  IF p_quotation_id IS NOT NULL THEN
    -- Log the price selection
    INSERT INTO public.pricing_calculation_logs (
      quotation_id,
      function_name,
      service_type,
      duration_hours,
      base_price,
      calculation_details
    ) VALUES (
      p_quotation_id,
      'get_correct_price_for_duration',
      p_service_type,
      p_duration_hours,
      COALESCE(price_record.price, 0),
      log_details
    );
  END IF;
  
  RETURN COALESCE(price_record.price, 0);
END;
$$ LANGUAGE plpgsql;

-- Update the calculate_quotation_total_amount function to handle null quotation_id
-- by adding a condition to only log if the quotation actually exists
CREATE OR REPLACE FUNCTION calculate_quotation_total_amount()
RETURNS TRIGGER AS $$
DECLARE
  base_amount DECIMAL(10, 2);
  discount_amount DECIMAL(10, 2);
  tax_amount DECIMAL(10, 2);
  log_details JSONB;
  quotation_exists BOOLEAN;
BEGIN
  -- Store original values for logging
  log_details := jsonb_build_object(
    'original_amount', NEW.amount,
    'service_type', NEW.service_type,
    'days_count', NEW.days_count,
    'duration_hours', NEW.duration_hours,
    'discount_percentage', NEW.discount_percentage,
    'tax_percentage', NEW.tax_percentage
  );
  
  -- Calculate base amount with days multiplier for charter services
  IF NEW.service_type = 'charter' THEN
    base_amount := NEW.amount * COALESCE(NEW.days_count, 1);
    log_details := log_details || jsonb_build_object(
      'calculation', 'Charter service: ' || NEW.amount || ' * ' || COALESCE(NEW.days_count, 1) || ' days',
      'base_amount_pre_discount', base_amount
    );
  ELSE
    base_amount := NEW.amount;
    log_details := log_details || jsonb_build_object(
      'calculation', 'Non-charter service: using base amount',
      'base_amount_pre_discount', base_amount
    );
  END IF;
  
  -- Calculate discount
  discount_amount := base_amount * (COALESCE(NEW.discount_percentage, 0) / 100);
  log_details := log_details || jsonb_build_object(
    'discount_calculation', base_amount || ' * ' || (COALESCE(NEW.discount_percentage, 0) / 100),
    'discount_amount', discount_amount
  );
  
  -- Calculate tax
  tax_amount := (base_amount - discount_amount) * (COALESCE(NEW.tax_percentage, 0) / 100);
  log_details := log_details || jsonb_build_object(
    'tax_calculation', (base_amount - discount_amount) || ' * ' || (COALESCE(NEW.tax_percentage, 0) / 100),
    'tax_amount', tax_amount
  );
  
  -- Set final total amount
  NEW.total_amount := base_amount - discount_amount + tax_amount;
  log_details := log_details || jsonb_build_object(
    'final_calculation', base_amount || ' - ' || discount_amount || ' + ' || tax_amount,
    'total_amount', NEW.total_amount
  );
  
  -- Only log if this is an update (not an insert)
  -- For inserts, the quotation_id doesn't exist yet in the database
  IF TG_OP = 'UPDATE' THEN
    -- Check if the quotation exists
    SELECT EXISTS(
      SELECT 1 FROM public.quotations WHERE id = NEW.id
    ) INTO quotation_exists;
    
    -- Only log if the quotation exists
    IF quotation_exists THEN
      -- Log the calculation
      INSERT INTO public.pricing_calculation_logs (
        quotation_id,
        function_name,
        base_price,
        days_count,
        duration_hours,
        service_type,
        calculated_amount,
        applied_discount,
        applied_tax,
        final_amount,
        calculation_details
      ) VALUES (
        NEW.id,
        'calculate_quotation_total_amount',
        NEW.amount,
        NEW.days_count,
        NEW.duration_hours,
        NEW.service_type,
        base_amount,
        discount_amount,
        tax_amount,
        NEW.total_amount,
        log_details
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 
-- Create a logging table to track pricing calculations
CREATE TABLE IF NOT EXISTS public.pricing_calculation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  base_price DECIMAL(10, 2),
  days_count INTEGER,
  duration_hours INTEGER,
  service_type TEXT,
  calculated_amount DECIMAL(10, 2),
  applied_discount DECIMAL(10, 2),
  applied_tax DECIMAL(10, 2),
  final_amount DECIMAL(10, 2),
  calculation_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modify the calculate_charter_price function to include logging
CREATE OR REPLACE FUNCTION calculate_charter_price(
  base_price DECIMAL(10, 2),
  days_count INTEGER
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  result DECIMAL(10, 2);
BEGIN
  -- Calculate result
  result := base_price * COALESCE(days_count, 1);
  
  -- Log calculation
  INSERT INTO public.pricing_calculation_logs (
    function_name,
    base_price,
    days_count, 
    calculated_amount,
    calculation_details
  ) VALUES (
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
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enhance the calculate_quotation_total_amount function with detailed logging
CREATE OR REPLACE FUNCTION calculate_quotation_total_amount()
RETURNS TRIGGER AS $$
DECLARE
  base_amount DECIMAL(10, 2);
  discount_amount DECIMAL(10, 2);
  tax_amount DECIMAL(10, 2);
  log_details JSONB;
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a diagnostic view to easily inspect calculations
CREATE OR REPLACE VIEW public.pricing_diagnostic_view AS
SELECT
  q.id AS quotation_id,
  q.title,
  q.service_type,
  q.vehicle_type,
  q.duration_hours,
  q.days_count,
  q.amount AS base_price,
  q.discount_percentage,
  q.tax_percentage,
  CASE
    WHEN q.service_type = 'charter' THEN q.amount * COALESCE(q.days_count, 1)
    ELSE q.amount
  END AS expected_base_amount,
  q.total_amount AS actual_total_amount,
  l.calculation_details,
  l.created_at AS calculation_time
FROM
  public.quotations q
LEFT JOIN LATERAL (
  SELECT *
  FROM public.pricing_calculation_logs
  WHERE quotation_id = q.id
  ORDER BY created_at DESC
  LIMIT 1
) l ON true
ORDER BY
  l.created_at DESC; 
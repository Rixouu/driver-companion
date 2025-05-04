-- Add days_count column to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS days_count INTEGER DEFAULT 1;

-- Recreate the calculate_quotation_total_amount function
CREATE OR REPLACE FUNCTION calculate_quotation_total_amount()
RETURNS TRIGGER AS $$
DECLARE
  base_amount DECIMAL(10, 2);
BEGIN
  -- Calculate base amount with days multiplier for charter services
  IF NEW.service_type = 'charter' THEN
    base_amount := NEW.amount * COALESCE(NEW.days_count, 1);
  ELSE
    base_amount := NEW.amount;
  END IF;
  
  -- Apply discount and tax
  NEW.total_amount := base_amount * (1 - COALESCE(NEW.discount_percentage, 0) / 100) * (1 + COALESCE(NEW.tax_percentage, 0) / 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS calculate_quotation_total_amount_trigger ON public.quotations;
CREATE TRIGGER calculate_quotation_total_amount_trigger
BEFORE INSERT OR UPDATE OF amount, discount_percentage, tax_percentage, days_count
ON public.quotations
FOR EACH ROW EXECUTE FUNCTION calculate_quotation_total_amount();

-- Recreate the calculate_charter_price function
CREATE OR REPLACE FUNCTION calculate_charter_price(
  base_price DECIMAL(10, 2),
  days_count INTEGER
) RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN base_price * COALESCE(days_count, 1);
END;
$$ LANGUAGE plpgsql;

-- Drop the existing view first
DROP VIEW IF EXISTS public.quotation_summary_view;

-- Then recreate the view with the new columns
CREATE VIEW public.quotation_summary_view AS
SELECT
  q.id,
  q.title,
  q.status,
  q.customer_name,
  q.customer_email,
  q.service_type,
  q.vehicle_type,
  q.expiry_date,
  q.amount,
  q.discount_percentage,
  q.tax_percentage,
  q.days_count,
  q.duration_hours,
  CASE
    WHEN q.service_type = 'charter' THEN calculate_charter_price(q.amount, q.days_count)
    ELSE q.amount
  END AS calculated_amount,
  q.total_amount,
  q.currency,
  q.quote_number,
  q.created_at,
  q.updated_at,
  q.converted_to_booking_id,
  q.merchant_id,
  CASE
    WHEN q.status = 'expired' OR (q.status IN ('draft', 'sent') AND q.expiry_date < NOW()) THEN true
    ELSE false
  END AS is_expired,
  CASE
    WHEN q.converted_to_booking_id IS NOT NULL THEN true
    ELSE false
  END AS is_converted,
  b.status AS booking_status
FROM
  public.quotations q
LEFT JOIN
  public.bookings b ON q.converted_to_booking_id = b.id; 
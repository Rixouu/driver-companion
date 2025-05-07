-- Add updated_at trigger function for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create admin_users table if not exists
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at trigger for customers table
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create pricing_categories table
CREATE TABLE IF NOT EXISTS public.pricing_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  service_types TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  merchant_notes TEXT,
  customer_notes TEXT,
  service_type TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  pickup_location TEXT,
  dropoff_location TEXT,
  pickup_date DATE,
  pickup_time TIME,
  passenger_count INTEGER,
  duration_hours INTEGER,
  days_count INTEGER DEFAULT 1,
  expiry_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  converted_to_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reference_code TEXT,
  quote_number SERIAL,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quotation_items table for line items
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pricing_items table
CREATE TABLE IF NOT EXISTS public.pricing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.pricing_categories(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quotation_activities table for tracking activities
CREATE TABLE IF NOT EXISTS public.quotation_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add triggers to update updated_at timestamp
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_items_updated_at
BEFORE UPDATE ON public.quotation_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_categories_updated_at
BEFORE UPDATE ON public.pricing_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_items_updated_at
BEFORE UPDATE ON public.pricing_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing categories
INSERT INTO public.pricing_categories (name, description, service_types, sort_order) VALUES
('Airport Transfers', 'Transfers to and from airports', ARRAY['airportTransferHaneda', 'airportTransferNarita'], 1),
('Charter Services', 'Vehicle charter for hourly hire', ARRAY['charter'], 2),
('Platinum', 'Premium luxury service', ARRAY['charter', 'airportTransferHaneda', 'airportTransferNarita'], 3),
('Luxury', 'High-end luxury service', ARRAY['charter', 'airportTransferHaneda', 'airportTransferNarita'], 4),
('Premium', 'Standard premium service', ARRAY['charter', 'airportTransferHaneda', 'airportTransferNarita'], 5)
ON CONFLICT DO NOTHING;

-- Insert pricing items for Platinum - charter
DO $$
DECLARE
  platinum_id UUID;
  luxury_id UUID;
  premium_id UUID;
BEGIN
  -- Get the category IDs
  SELECT id INTO platinum_id FROM public.pricing_categories WHERE name = 'Platinum' LIMIT 1;
  SELECT id INTO luxury_id FROM public.pricing_categories WHERE name = 'Luxury' LIMIT 1;
  SELECT id INTO premium_id FROM public.pricing_categories WHERE name = 'Premium' LIMIT 1;
  
  -- Insert pricing items for Platinum
  IF platinum_id IS NOT NULL THEN
    -- Mercedes Benz V Class Black Suite
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'charter', 1, 23000, 'JPY'),
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'charter', 4, 92000, 'JPY'),
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'charter', 6, 138000, 'JPY'),
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'charter', 8, 184000, 'JPY'),
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'charter', 10, 241500, 'JPY'),
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'charter', 12, 299000, 'JPY');
    
    -- Toyota Alphard Executive Lounge
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (platinum_id, 'Toyota Alphard Executive Lounge', 'charter', 1, 23000, 'JPY'),
      (platinum_id, 'Toyota Alphard Executive Lounge', 'charter', 4, 92000, 'JPY'),
      (platinum_id, 'Toyota Alphard Executive Lounge', 'charter', 6, 138000, 'JPY'),
      (platinum_id, 'Toyota Alphard Executive Lounge', 'charter', 8, 184000, 'JPY'),
      (platinum_id, 'Toyota Alphard Executive Lounge', 'charter', 10, 241500, 'JPY'),
      (platinum_id, 'Toyota Alphard Executive Lounge', 'charter', 12, 299000, 'JPY');
    
    -- Haneda Airport Transfer
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'airportTransferHaneda', 1, 46000, 'JPY'),
      (platinum_id, 'Toyota Alphard Executive Lounge', 'airportTransferHaneda', 1, 46000, 'JPY');
    
    -- Narita Airport Transfer
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (platinum_id, 'Mercedes Benz V Class - Black Suite', 'airportTransferNarita', 1, 69000, 'JPY'),
      (platinum_id, 'Toyota Alphard Executive Lounge', 'airportTransferNarita', 1, 69000, 'JPY');
  END IF;
  
  -- Insert pricing items for Luxury
  IF luxury_id IS NOT NULL THEN
    -- Mercedes Benz V class Extra Long
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'charter', 1, 18000, 'JPY'),
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'charter', 4, 72000, 'JPY'),
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'charter', 6, 108000, 'JPY'),
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'charter', 8, 144000, 'JPY'),
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'charter', 10, 189000, 'JPY'),
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'charter', 12, 234000, 'JPY');
    
    -- Toyota Alphard Z class
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (luxury_id, 'Toyota Alphard Z class', 'charter', 1, 18000, 'JPY'),
      (luxury_id, 'Toyota Alphard Z class', 'charter', 4, 72000, 'JPY'),
      (luxury_id, 'Toyota Alphard Z class', 'charter', 6, 108000, 'JPY'),
      (luxury_id, 'Toyota Alphard Z class', 'charter', 8, 144000, 'JPY'),
      (luxury_id, 'Toyota Alphard Z class', 'charter', 10, 189000, 'JPY'),
      (luxury_id, 'Toyota Alphard Z class', 'charter', 12, 234000, 'JPY');
    
    -- Haneda Airport Transfer
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'airportTransferHaneda', 1, 36000, 'JPY'),
      (luxury_id, 'Toyota Alphard Z class', 'airportTransferHaneda', 1, 36000, 'JPY');
    
    -- Narita Airport Transfer
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (luxury_id, 'Mercedes Benz V class - Extra Long', 'airportTransferNarita', 1, 54000, 'JPY'),
      (luxury_id, 'Toyota Alphard Z class', 'airportTransferNarita', 1, 54000, 'JPY');
  END IF;
  
  -- Insert pricing items for Premium
  IF premium_id IS NOT NULL THEN
    -- Toyota Hi-Ace Grand Cabin
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'charter', 1, 16000, 'JPY'),
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'charter', 4, 64000, 'JPY'),
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'charter', 6, 96000, 'JPY'),
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'charter', 8, 128000, 'JPY'),
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'charter', 10, 169000, 'JPY'),
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'charter', 12, 208000, 'JPY');
    
    -- Haneda Airport Transfer
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'airportTransferHaneda', 1, 32000, 'JPY');
    
    -- Narita Airport Transfer
    INSERT INTO public.pricing_items (category_id, vehicle_type, service_type, duration_hours, price, currency)
    VALUES
      (premium_id, 'Toyota Hi-Ace Grand Cabin', 'airportTransferNarita', 1, 48000, 'JPY');
  END IF;
END
$$;

-- Add RLS policies for quotations
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON public.quotations
  FOR ALL
  TO authenticated
  USING (true);

-- Add RLS policies for quotation_items
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON public.quotation_items
  FOR ALL
  TO authenticated
  USING (true);

-- Add RLS policies for pricing_categories
ALTER TABLE public.pricing_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read operations for all users"
  ON public.pricing_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow write operations for admin users"
  ON public.pricing_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- Add RLS policies for pricing_items
ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read operations for all users"
  ON public.pricing_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow write operations for admin users"
  ON public.pricing_items
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- Add RLS policies for quotation_activities
ALTER TABLE public.quotation_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON public.quotation_activities
  FOR ALL
  TO authenticated
  USING (true);

-- Create a function to check for expired quotations and update their status
CREATE OR REPLACE FUNCTION check_quotation_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If the quotation is in draft or sent status and is expired, update the status to expired
  IF (NEW.status IN ('draft', 'sent') AND NEW.expiry_date < NOW()) THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to check for expiry when updating quotations
CREATE TRIGGER check_quotation_expiry_trigger
BEFORE UPDATE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION check_quotation_expiry();

-- Create a view for quotation summary with status info
CREATE OR REPLACE VIEW public.quotation_summary_view AS
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email ON public.quotations(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotations_expiry_date ON public.quotations(expiry_date);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_activities_quotation_id ON public.quotation_activities(quotation_id);

-- Create a function to calculate charter price with days multiplier
CREATE OR REPLACE FUNCTION calculate_charter_price(
  base_price DECIMAL(10, 2),
  days_count INTEGER
) RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN base_price * COALESCE(days_count, 1);
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate the total amount considering days multiplier
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

-- Add trigger to calculate total amount
CREATE TRIGGER calculate_quotation_total_amount_trigger
BEFORE INSERT OR UPDATE OF amount, discount_percentage, tax_percentage, days_count
ON public.quotations
FOR EACH ROW EXECUTE FUNCTION calculate_quotation_total_amount(); 
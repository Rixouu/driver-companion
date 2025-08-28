-- Create customer segments table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI display
  icon VARCHAR(50) DEFAULT 'users', -- Icon name for UI
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for customer segments
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customer segments" ON public.customer_segments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage customer segments" ON public.customer_segments
  FOR ALL USING (auth.role() = 'authenticated');

-- Add segment_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON public.customer_segments(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_customers_segment_id ON public.customers(segment_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Insert default customer segments
INSERT INTO public.customer_segments (name, description, color, icon, sort_order) VALUES
  ('VIP', 'High-value customers with premium service requirements', '#f59e0b', 'crown', 1),
  ('Corporate', 'Business clients with regular service needs', '#3b82f6', 'building', 2),
  ('Regular', 'Standard individual customers', '#6b7280', 'user', 3),
  ('Occasional', 'Infrequent customers', '#84cc16', 'calendar', 4)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing customers table trigger if it doesn't exist
DO $$
BEGIN
  CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Trigger already exists, do nothing
END $$;

-- Create view for customer analytics
CREATE OR REPLACE VIEW public.customer_analytics AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.notes,
  c.created_at,
  c.updated_at,
  cs.name as segment_name,
  cs.description as segment_description,
  cs.color as segment_color,
  cs.icon as segment_icon,
  -- Calculate total spent from quotations
  COALESCE(q_stats.total_quotation_amount, 0) as total_quotation_amount,
  COALESCE(q_stats.quotation_count, 0) as quotation_count,
  -- Calculate total spent from bookings (using price amount from booking meta)
  COALESCE(b_stats.booking_count, 0) as booking_count,
  -- Last activity date
  GREATEST(
    COALESCE(q_stats.last_quotation_date, c.created_at),
    COALESCE(b_stats.last_booking_date, c.created_at)
  ) as last_activity_date,
  -- Customer lifetime value (combination of quotations and estimated booking values)
  COALESCE(q_stats.total_quotation_amount, 0) as total_spent
FROM public.customers c
LEFT JOIN public.customer_segments cs ON c.segment_id = cs.id
LEFT JOIN (
  SELECT 
    customer_id,
    SUM(COALESCE(payment_amount, amount)) as total_quotation_amount,
    COUNT(*) as quotation_count,
    MAX(created_at) as last_quotation_date
  FROM public.quotations 
  WHERE customer_id IS NOT NULL 
    AND status IN ('approved', 'paid', 'converted')
  GROUP BY customer_id
) q_stats ON c.id = q_stats.customer_id::uuid
LEFT JOIN (
  SELECT 
    customer_id::uuid as customer_id,
    COUNT(*) as booking_count,
    MAX(created_at) as last_booking_date
  FROM public.bookings 
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
) b_stats ON c.id = b_stats.customer_id;

-- Grant permissions on the view
GRANT SELECT ON public.customer_analytics TO authenticated;

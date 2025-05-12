-- Update RLS policies for pricing_calculation_logs
DROP POLICY IF EXISTS "Users can view pricing calculation logs" ON pricing_calculation_logs;
DROP POLICY IF EXISTS "Service role can manage pricing calculation logs" ON pricing_calculation_logs;

-- Create more permissive policies that allow authenticated users to perform all operations
CREATE POLICY "Authenticated users can perform all operations on pricing_calculation_logs" 
ON pricing_calculation_logs 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow service role full access as well
CREATE POLICY "Service role can manage pricing_calculation_logs" 
ON pricing_calculation_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true); 
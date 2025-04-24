-- Add driver_id column to inspections table
DO $$ 
BEGIN
  -- Check if the column exists before trying to add it
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'inspections' 
    AND column_name = 'driver_id'
  ) THEN
    -- Add the driver_id column
    ALTER TABLE public.inspections ADD COLUMN driver_id UUID REFERENCES public.drivers(id);
    
    -- Create an index for faster lookups
    CREATE INDEX inspections_driver_id_idx ON public.inspections(driver_id);
    
    -- Update RLS policies to include driver_id in conditions
    -- First check if the policy exists
    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'inspections' 
      AND policyname = 'Enable read access for all users'
    ) THEN
      ALTER POLICY "Enable read access for all users" ON "public"."inspections"
        USING (auth.uid() = inspector_id OR auth.uid() IN (
          SELECT user_id FROM public.users WHERE role = 'admin'
        ));
    END IF;
  END IF;
END $$; 
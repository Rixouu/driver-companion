-- Add the deleted_at column to the drivers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE drivers 
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$; 
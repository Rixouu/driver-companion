-- Migration: Remove fake unassigned driver and clean up unassigned tasks
-- This migration removes the fake "Unassigned Tasks" driver and updates
-- unassigned tasks to use NULL driver_id instead

-- Step 1: Update all tasks that are assigned to the fake unassigned driver
-- Set their driver_id to NULL to properly represent unassigned tasks
UPDATE crew_tasks 
SET driver_id = NULL,
    updated_at = NOW()
WHERE driver_id = '00000000-0000-0000-0000-000000000000';

-- Step 2: Remove the fake unassigned driver from the drivers table
DELETE FROM drivers 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Step 3: Update any driver capacity settings for the fake driver
-- (This should be empty, but just in case)
DELETE FROM driver_capacity_settings 
WHERE driver_id = '00000000-0000-0000-0000-000000000000';

-- Step 4: Add a comment to document the change
COMMENT ON COLUMN crew_tasks.driver_id IS 'Driver ID for assigned tasks, NULL for unassigned tasks';

-- Step 5: Create an index for better performance on unassigned tasks queries
CREATE INDEX IF NOT EXISTS idx_crew_tasks_unassigned 
ON crew_tasks (driver_id) 
WHERE driver_id IS NULL;

-- Step 6: Create an index for better performance on assigned tasks queries
CREATE INDEX IF NOT EXISTS idx_crew_tasks_assigned 
ON crew_tasks (driver_id) 
WHERE driver_id IS NOT NULL;

-- Verification queries (these should return 0 rows after the migration)
-- SELECT COUNT(*) FROM drivers WHERE id = '00000000-0000-0000-0000-000000000000';
-- SELECT COUNT(*) FROM crew_tasks WHERE driver_id = '00000000-0000-0000-0000-000000000000';
-- SELECT COUNT(*) FROM driver_capacity_settings WHERE driver_id = '00000000-0000-0000-0000-000000000000';

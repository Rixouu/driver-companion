-- =====================================================
-- Make driver_id nullable in crew_tasks table
-- This allows tasks to be created without a driver assignment
-- =====================================================

-- Remove the NOT NULL constraint from driver_id column
ALTER TABLE crew_tasks 
ALTER COLUMN driver_id DROP NOT NULL;

-- Add a comment to document the change
COMMENT ON COLUMN crew_tasks.driver_id IS 'Driver assigned to this task. NULL means unassigned.';

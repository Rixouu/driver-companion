-- Migration: Clean Unassigned Tasks System
-- This migration completely removes the fake unassigned driver system
-- and implements a clean NULL-based approach for unassigned tasks

BEGIN;

-- Step 1: Backup current state (optional, for safety)
-- CREATE TABLE IF NOT EXISTS crew_tasks_backup AS SELECT * FROM crew_tasks;

-- Step 2: Update all tasks assigned to the fake unassigned driver
-- Set their driver_id to NULL to properly represent unassigned tasks
UPDATE crew_tasks 
SET driver_id = NULL,
    updated_at = NOW()
WHERE driver_id = '00000000-0000-0000-0000-000000000000';

-- Step 3: Remove any driver capacity settings for the fake driver
DELETE FROM driver_capacity_settings 
WHERE driver_id = '00000000-0000-0000-0000-000000000000';

-- Step 4: Remove the fake unassigned driver from the drivers table
DELETE FROM drivers 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Step 5: Add constraints to ensure data integrity
-- Make sure driver_id references are valid (only existing drivers or NULL)
ALTER TABLE crew_tasks 
ADD CONSTRAINT fk_crew_tasks_driver_id 
FOREIGN KEY (driver_id) REFERENCES drivers(id) 
ON DELETE SET NULL;

-- Step 6: Create optimized indexes for better performance
-- Index for unassigned tasks queries
CREATE INDEX IF NOT EXISTS idx_crew_tasks_unassigned 
ON crew_tasks (start_date, task_type) 
WHERE driver_id IS NULL;

-- Index for assigned tasks queries
CREATE INDEX IF NOT EXISTS idx_crew_tasks_assigned 
ON crew_tasks (driver_id, start_date) 
WHERE driver_id IS NOT NULL;

-- Index for driver-specific task queries
CREATE INDEX IF NOT EXISTS idx_crew_tasks_driver_date 
ON crew_tasks (driver_id, start_date);

-- Step 7: Add helpful comments
COMMENT ON COLUMN crew_tasks.driver_id IS 'Driver ID for assigned tasks, NULL for unassigned tasks';
COMMENT ON TABLE crew_tasks IS 'Crew tasks with NULL driver_id for unassigned tasks';

-- Step 8: Create a view for easy unassigned tasks queries
CREATE OR REPLACE VIEW unassigned_crew_tasks AS
SELECT 
    id,
    task_number,
    title,
    description,
    task_type,
    task_status,
    priority,
    start_date,
    end_date,
    start_time,
    end_time,
    hours_per_day,
    total_hours,
    location,
    customer_name,
    customer_phone,
    updated_at
FROM crew_tasks 
WHERE driver_id IS NULL;

-- Step 9: Create a view for assigned tasks with driver info
CREATE OR REPLACE VIEW assigned_crew_tasks AS
SELECT 
    ct.id,
    ct.title,
    ct.description,
    ct.task_type,
    ct.priority,
    ct.start_date,
    ct.end_date,
    ct.start_time,
    ct.end_time,
    ct.hours_per_day,
    ct.location,
    ct.customer_name,
    ct.status,
    ct.created_at,
    ct.updated_at,
    d.id as driver_id,
    d.first_name,
    d.last_name,
    CONCAT(d.first_name, ' ', d.last_name) as driver_name
FROM crew_tasks ct
JOIN drivers d ON ct.driver_id = d.id
WHERE ct.driver_id IS NOT NULL;

-- Step 10: Grant permissions for the views
GRANT SELECT ON unassigned_crew_tasks TO authenticated;
GRANT SELECT ON assigned_crew_tasks TO authenticated;

COMMIT;

-- Verification queries
-- These should return 0 rows after the migration:
-- SELECT COUNT(*) FROM drivers WHERE id = '00000000-0000-0000-0000-000000000000';
-- SELECT COUNT(*) FROM crew_tasks WHERE driver_id = '00000000-0000-0000-0000-000000000000';
-- SELECT COUNT(*) FROM driver_capacity_settings WHERE driver_id = '00000000-0000-0000-0000-000000000000';

-- These should show the new structure:
-- SELECT COUNT(*) FROM unassigned_crew_tasks;
-- SELECT COUNT(*) FROM assigned_crew_tasks;

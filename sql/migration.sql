-- Run migrations in the correct order
-- First create the trigger function
\i sql/timestamps.sql

-- Then create the tables in order of dependencies
\i sql/inspection_templates_table.sql
\i sql/inspection_sections_table.sql
\i sql/inspection_items_table.sql
\i sql/inspections_table.sql
\i sql/inspection_item_results_table.sql

-- Print completion message
DO $$
BEGIN
  RAISE NOTICE 'Migrations completed successfully';
END $$; 
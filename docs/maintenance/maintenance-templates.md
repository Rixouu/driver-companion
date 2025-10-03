# Maintenance Task Templates

This document explains how to set up and use the maintenance task templates feature in the Vehicle Inspection application.

## Overview

The maintenance task templates feature allows users to quickly create maintenance tasks using predefined templates. Each template includes:

- Title
- Description
- Category
- Estimated Duration (in hours)
- Estimated Cost
- Priority (low, medium, high)

This feature significantly improves the user experience by:
- Reducing the time needed to create common maintenance tasks
- Ensuring consistency in task descriptions and estimates
- Providing standard durations and costs for common maintenance procedures

## Database Setup

To set up the maintenance task templates feature, you need to create a new table in your Supabase database and populate it with template data.

1. Navigate to the Supabase SQL Editor
2. Run the SQL script from `migrations/maintenance_task_templates.sql`

This script will:
- Create the `maintenance_task_templates` table
- Set up appropriate RLS (Row Level Security) policies
- Populate the table with common maintenance tasks across various categories

## Using Templates in the Application

The application provides a user-friendly interface for selecting templates:

1. When creating a new maintenance task, users will see a "Use Template" tab
2. Users can browse templates by category or search for specific tasks
3. After selecting a template, the form is automatically populated with the template data
4. Users can then customize the task details if needed before saving

## Managing Templates

### Adding New Templates

To add new templates, you can:

1. Use the Supabase dashboard to insert new records into the `maintenance_task_templates` table
2. Run SQL INSERT statements

Example SQL to add a new template:

```sql
INSERT INTO public.maintenance_task_templates 
  (title, description, category, estimated_duration, estimated_cost, priority)
VALUES 
  ('Wiper Blade Replacement', 'Replace front and rear wiper blades', 'Exterior', 0.5, 35, 'low');
```

### Updating Existing Templates

To update existing templates:

1. Use the Supabase dashboard to edit records in the `maintenance_task_templates` table
2. Run SQL UPDATE statements

Example SQL to update a template:

```sql
UPDATE public.maintenance_task_templates
SET estimated_cost = 60, estimated_duration = 1.5
WHERE title = 'Oil Change';
```

### Deleting Templates

To delete templates:

1. Use the Supabase dashboard to delete records from the `maintenance_task_templates` table
2. Run SQL DELETE statements

Example SQL to delete a template:

```sql
DELETE FROM public.maintenance_task_templates
WHERE title = 'Wiper Blade Replacement';
```

## Template Categories

The default installation includes templates in these categories:

- Engine Maintenance
- Brake System
- Transmission
- Cooling System
- Suspension & Steering
- Electrical System
- Tires
- HVAC System
- Scheduled Maintenance

You can add new categories simply by including them in the `category` field when creating new templates.

## Customizing the Template Selector

The template selector component (`TaskTemplateSelector`) can be found in `components/maintenance/task-template-selector.tsx`. You can customize this component to change:

- The appearance of template items
- The grouping of templates
- The search functionality
- The information displayed for each template

## Troubleshooting

If templates are not appearing in the selector:

1. Check that the `maintenance_task_templates` table exists in your database
2. Verify that the table contains template records
3. Ensure that the RLS policies are correctly set up to allow reading templates
4. Check the browser console for any errors when loading templates 
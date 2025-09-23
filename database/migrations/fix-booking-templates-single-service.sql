-- Fix Booking Templates to Work with Single Service Structure
-- The current database only supports single services per booking, not booking_items arrays

-- Update Booking Confirmed template
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
      '{{/each}}', '{{/if}}'
    ),
    '{{#unless booking_items}}', '{{#unless booking_id}}'
  ),
  '{{/unless}}', '{{/unless}}'
)
WHERE name = 'Booking Confirmed' 
AND html_content LIKE '%{{#each booking_items}}%';

-- Update Booking Details template  
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
      '{{/each}}', '{{/if}}'
    ),
    '{{#unless booking_items}}', '{{#unless booking_id}}'
  ),
  '{{/unless}}', '{{/unless}}'
)
WHERE name = 'Booking Details' 
AND html_content LIKE '%{{#each booking_items}}%';

-- Update Booking Invoice template
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
      '{{/each}}', '{{/if}}'
    ),
    '{{#unless booking_items}}', '{{#unless booking_id}}'
  ),
  '{{/unless}}', '{{/unless}}'
)
WHERE name = 'Booking Invoice' 
AND html_content LIKE '%{{#each booking_items}}%';

-- Update Trip Coming Soon Reminder template
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
      '{{/each}}', '{{/if}}'
    ),
    '{{#unless booking_items}}', '{{#unless booking_id}}'
  ),
  '{{/unless}}', '{{/unless}}'
)
WHERE name = 'Trip Coming Soon Reminder' 
AND html_content LIKE '%{{#each booking_items}}%';

-- Also need to update the template variables to use single booking fields instead of booking_items fields
-- The templates should use:
-- - service_name instead of description
-- - vehicle_make/vehicle_model instead of vehicle_type  
-- - price_amount instead of total_price
-- - date/time instead of pickup_date/pickup_time
-- - etc.

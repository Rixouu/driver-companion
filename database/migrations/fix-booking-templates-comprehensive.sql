-- Comprehensive Fix for Booking Templates to Work with Single Service Structure
-- This updates all booking templates to work with the current single-service booking structure
-- instead of expecting booking_items arrays

-- 1. Update Booking Confirmed template
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
          '{{/each}}', '{{/if}}'
        ),
        '{{#unless booking_items}}', '{{#unless booking_id}}'
      ),
      '{{/unless}}', '{{/unless}}'
    ),
    '{{description}}', '{{service_name}}'
  ),
  '{{total_price}}', '{{total_amount}}'
)
WHERE name = 'Booking Confirmed' 
AND html_content LIKE '%{{#each booking_items}}%';

-- 2. Update Booking Details template  
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
          '{{/each}}', '{{/if}}'
        ),
        '{{#unless booking_items}}', '{{#unless booking_id}}'
      ),
      '{{/unless}}', '{{/unless}}'
    ),
    '{{description}}', '{{service_name}}'
  ),
  '{{total_price}}', '{{total_amount}}'
)
WHERE name = 'Booking Details' 
AND html_content LIKE '%{{#each booking_items}}%';

-- 3. Update Booking Invoice template
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
          '{{/each}}', '{{/if}}'
        ),
        '{{#unless booking_items}}', '{{#unless booking_id}}'
      ),
      '{{/unless}}', '{{/unless}}'
    ),
    '{{description}}', '{{service_name}}'
  ),
  '{{total_price}}', '{{total_amount}}'
)
WHERE name = 'Booking Invoice' 
AND html_content LIKE '%{{#each booking_items}}%';

-- 4. Update Trip Coming Soon Reminder template
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
          '{{/each}}', '{{/if}}'
        ),
        '{{#unless booking_items}}', '{{#unless booking_id}}'
      ),
      '{{/unless}}', '{{/unless}}'
    ),
    '{{description}}', '{{service_name}}'
  ),
  '{{total_price}}', '{{total_amount}}'
)
WHERE name = 'Trip Coming Soon Reminder' 
AND html_content LIKE '%{{#each booking_items}}%';

-- 5. Update Payment Complete template (if it exists and uses booking_items)
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
          '{{/each}}', '{{/if}}'
        ),
        '{{#unless booking_items}}', '{{#unless booking_id}}'
      ),
      '{{/unless}}', '{{/unless}}'
    ),
    '{{description}}', '{{service_name}}'
  ),
  '{{total_price}}', '{{total_amount}}'
)
WHERE name = 'Payment Complete' 
AND html_content LIKE '%{{#each booking_items}}%';

-- 6. Update Vehicle Upgrade Payment template (if it exists and uses booking_items)
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
          '{{/each}}', '{{/if}}'
        ),
        '{{#unless booking_items}}', '{{#unless booking_id}}'
      ),
      '{{/unless}}', '{{/unless}}'
    ),
    '{{description}}', '{{service_name}}'
  ),
  '{{total_price}}', '{{total_amount}}'
)
WHERE name = 'Vehicle Upgrade Payment' 
AND html_content LIKE '%{{#each booking_items}}%';

-- 7. Update Vehicle Downgrade Refund template (if it exists and uses booking_items)
UPDATE notification_templates 
SET html_content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, '{{#each booking_items}}', '{{#if booking_id}}'),
          '{{/each}}', '{{/if}}'
        ),
        '{{#unless booking_items}}', '{{#unless booking_id}}'
      ),
      '{{/unless}}', '{{/unless}}'
    ),
    '{{description}}', '{{service_name}}'
  ),
  '{{total_price}}', '{{total_amount}}'
)
WHERE name = 'Vehicle Downgrade Refund' 
AND html_content LIKE '%{{#each booking_items}}%';

-- Additional field mappings that might be needed:
-- - {{service_type_name}} should map to {{service_type}}
-- - {{vehicle_type}} should map to {{vehicle_make}} {{vehicle_model}}
-- - {{pickup_date}} should map to {{date}}
-- - {{pickup_time}} should map to {{time}}
-- - {{total_price}} should map to {{total_amount}}
-- - {{unit_price}} should map to {{base_amount}} or {{price_amount}}

-- Note: The templates now expect single booking data instead of booking_items arrays.
-- The booking email routes have been updated to provide the correct data structure.

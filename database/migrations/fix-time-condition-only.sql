-- Fix only the time-based pricing condition
-- This will use the precomputed show_time_adjustment flag

UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            {{#if service_type_airport}}
            {{#if time_based_discount}}',
  '            {{#if show_time_adjustment == "yes"}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';

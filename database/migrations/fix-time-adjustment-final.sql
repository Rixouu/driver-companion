-- Fix the time adjustment condition to use a more explicit check
UPDATE notification_templates 
SET html_content = REPLACE(
  html_content,
  '{{#if time_based_discount}}',
  '{{#if time_based_discount > 0}}'
)
WHERE name = 'Quotation Sent' AND is_active = true;
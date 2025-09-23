-- Fix the time adjustment condition to use a simpler check
UPDATE notification_templates 
SET html_content = REPLACE(
  html_content,
  '{{#if time_based_discount > 0}}',
  '{{#if time_based_discount}}'
)
WHERE name = 'Quotation Sent' AND is_active = true;

-- Fix time-based pricing condition to use null check instead of > 0
UPDATE notification_templates 
SET html_content = REPLACE(
  html_content,
  '{{#if time_based_discount > 0}}',
  '{{#if time_based_discount}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';
